import { useLiveQuery } from 'dexie-react-hooks'
import { db, type DailyExerciseLog, type DailyWorkoutResult } from '@/db/schema'
import type { Exercise, Routine } from '@/domain/types'
import { importFileSchema, type ImportFile } from './importSchema'
import { EXPORT_SCHEMA_VERSION } from './schemaVersion'

export type ImportMode = 'replace' | 'merge'

export interface ImportSummary {
  added: number
  updated: number
  skipped: number
}

export type ParseResult = { ok: true; file: ImportFile } | { ok: false; error: string }

export function parseImportFile(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'File bukan JSON yang valid.' }
  }

  const result = importFileSchema.safeParse(json)
  if (!result.success) {
    return { ok: false, error: 'File tidak sesuai format ekspor Workout Log.' }
  }

  const file = result.data
  if (file.schemaVersion > EXPORT_SCHEMA_VERSION) {
    return {
      ok: false,
      error:
        'File ini berasal dari versi aplikasi yang lebih baru. Perbarui aplikasi dulu sebelum mengimpor.',
    }
  }

  return { ok: true, file: migrate(file) }
}

// Rantai migrasi skema lama -> baru. Baru ada schemaVersion 1 sejauh ini,
// jadi belum ada langkah migrasi nyata — kerangka ini disiapkan supaya
// penambahan schemaVersion baru nanti tinggal ditambahkan satu langkah di
// sini, tanpa mengubah alur import lainnya.
function migrate(file: ImportFile): ImportFile {
  return file
}

async function snapshotCurrentState(): Promise<void> {
  const [exercises, routines, dailyExerciseLogs, dailyWorkoutResults] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.dailyExerciseLogs.toArray(),
    db.dailyWorkoutResults.toArray(),
  ])

  await db.recoverySnapshot.put({
    id: 'latest',
    createdAt: new Date().toISOString(),
    data: { exercises, routines, dailyExerciseLogs, dailyWorkoutResults },
  })
}

// Interface minimal (bukan Table Dexie langsung) supaya helper generik di
// bawah tidak terjebak varians tipe method Dexie yang rumit (mis. `modify`)
// — di sini cuma butuh get/add/put yang sudah cukup untuk logika merge.
interface MergeableTable<T> {
  get(key: string): Promise<T | undefined>
  add(item: T): Promise<unknown>
  put(item: T): Promise<unknown>
}

async function mergeAuditable<T extends { id: string; updatedAt: string }>(
  table: MergeableTable<T>,
  incoming: T[],
  summary: ImportSummary,
): Promise<void> {
  for (const record of incoming) {
    const existing = await table.get(record.id)
    if (!existing) {
      await table.add(record)
      summary.added += 1
    } else if (new Date(record.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
      await table.put(record)
      summary.updated += 1
    } else {
      summary.skipped += 1
    }
  }
}

// dailyExerciseLogs & dailyWorkoutResults tidak punya field Auditable (cuma
// keyed oleh tanggal, tanpa updatedAt) — jadi "gabungkan" untuk kedua tabel
// ini berarti: tanggal baru ditambahkan, tanggal yang sudah ada ditimpa isi
// dari file (tidak ada timestamp yang bisa dibandingkan untuk tahu mana
// yang lebih baru).
async function mergeByDateKey<T extends { date: string }>(
  table: MergeableTable<T>,
  incoming: T[],
  summary: ImportSummary,
): Promise<void> {
  for (const record of incoming) {
    const existing = await table.get(record.date)
    if (!existing) {
      await table.add(record)
      summary.added += 1
    } else {
      await table.put(record)
      summary.updated += 1
    }
  }
}

export async function runImport(file: ImportFile, mode: ImportMode): Promise<ImportSummary> {
  const summary: ImportSummary = { added: 0, updated: 0, skipped: 0 }

  // Satu transaksi untuk seluruh impor (termasuk snapshot pemulihan): kalau
  // ada satu saja langkah yang gagal, semuanya dibatalkan dan tidak ada
  // perubahan sama sekali (bagian 8.2 spesifikasi).
  await db.transaction(
    'rw',
    db.exercises,
    db.routines,
    db.dailyExerciseLogs,
    db.dailyWorkoutResults,
    db.recoverySnapshot,
    async () => {
      await snapshotCurrentState()

      if (mode === 'replace') {
        await Promise.all([
          db.exercises.clear(),
          db.routines.clear(),
          db.dailyExerciseLogs.clear(),
          db.dailyWorkoutResults.clear(),
        ])
        await Promise.all([
          db.exercises.bulkAdd(file.data.exercises as Exercise[]),
          db.routines.bulkAdd(file.data.routines as Routine[]),
          db.dailyExerciseLogs.bulkAdd(file.data.dailyExerciseLogs),
          db.dailyWorkoutResults.bulkAdd(file.data.dailyWorkoutResults),
        ])
        summary.added =
          file.data.exercises.length +
          file.data.routines.length +
          file.data.dailyExerciseLogs.length +
          file.data.dailyWorkoutResults.length
        return
      }

      await mergeAuditable<Exercise>(db.exercises, file.data.exercises as Exercise[], summary)
      await mergeAuditable<Routine>(db.routines, file.data.routines as Routine[], summary)
      await mergeByDateKey<DailyExerciseLog>(
        db.dailyExerciseLogs,
        file.data.dailyExerciseLogs,
        summary,
      )
      await mergeByDateKey<DailyWorkoutResult>(
        db.dailyWorkoutResults,
        file.data.dailyWorkoutResults,
        summary,
      )
    },
  )

  return summary
}

export function useHasRecoverySnapshot(): boolean {
  const snapshot = useLiveQuery(() => db.recoverySnapshot.get('latest'), [])
  return Boolean(snapshot)
}

// Snapshot bersifat sekali pakai: begitu dipulihkan, langsung dihapus
// supaya tidak dikira masih berlaku untuk impor berikutnya.
export async function restoreRecoverySnapshot(): Promise<boolean> {
  const snapshot = await db.recoverySnapshot.get('latest')
  if (!snapshot) return false

  await db.transaction(
    'rw',
    db.exercises,
    db.routines,
    db.dailyExerciseLogs,
    db.dailyWorkoutResults,
    db.recoverySnapshot,
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.dailyExerciseLogs.clear(),
        db.dailyWorkoutResults.clear(),
      ])
      await Promise.all([
        db.exercises.bulkAdd(snapshot.data.exercises),
        db.routines.bulkAdd(snapshot.data.routines),
        db.dailyExerciseLogs.bulkAdd(snapshot.data.dailyExerciseLogs),
        db.dailyWorkoutResults.bulkAdd(snapshot.data.dailyWorkoutResults),
      ])
      await db.recoverySnapshot.delete('latest')
    },
  )

  return true
}
