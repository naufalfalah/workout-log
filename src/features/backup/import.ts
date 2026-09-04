import { useLiveQuery } from 'dexie-react-hooks'
import { ulid } from 'ulid'

import { db, type DailyExerciseLog, type DailyWorkoutResult } from '@/db/schema'
import type { Exercise, SimpleRoutine } from '@/domain/types'
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

  // Migrasi jalan di JSON mentah, SEBELUM validasi Zod — skema Zod cuma
  // mengenal bentuk terbaru, jadi file versi lama (mis. weightKg number)
  // harus diubah bentuk dulu supaya bisa lolos validasi.
  const migrated = migrateRawToLatest(json)

  const result = importFileSchema.safeParse(migrated)
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

  return { ok: true, file }
}

// Rantai migrasi skema lama -> baru, dijalankan di atas JSON mentah (belum
// divalidasi Zod) — tiap langkah menaikkan schemaVersion satu per satu
// supaya file yang jauh lebih lama tetap bisa diimpor lewat langkah-langkah
// berikutnya secara berurutan.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateRawToLatest(json: any): unknown {
  if (typeof json !== 'object' || json === null) return json

  let current = json
  if (current.schemaVersion === 1) current = migrateV1ToV2(current)
  if (current.schemaVersion === 2) current = migrateV2ToV3(current)
  if (current.schemaVersion === 3) current = migrateV3ToV4(current)
  return current
}

// schemaVersion 1 -> 2: beban pindah dari selalu-kg (weightKg / kg) ke
// {value, unit} — data lama diasumsikan unit 'kg' karena itu satu-satunya
// unit yang pernah dipakai sebelum migrasi ini.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV1ToV2(json: any): unknown {
  const toWeight = (kg: unknown) => ({ value: typeof kg === 'number' ? kg : 0, unit: 'kg' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrateLoadTarget = (target: any) => {
    if (!target || (target.type !== 'absolute' && target.type !== 'bodyweight_plus')) {
      return target
    }
    const { kg, ...rest } = target
    return { ...rest, weight: toWeight(kg) }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const migrateEntry = (entry: any) => {
    const { weightKg, ...rest } = entry
    return { ...rest, weight: toWeight(weightKg) }
  }

  return {
    ...json,
    schemaVersion: 2,
    data: {
      ...json.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      exercises: (json.data?.exercises ?? []).map((ex: any) => {
        const { defaultWeightKg, ...rest } = ex
        return {
          ...rest,
          defaultWeight:
            typeof defaultWeightKg === 'number' ? toWeight(defaultWeightKg) : undefined,
        }
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      routines: (json.data?.routines ?? []).map((routine: any) => ({
        ...routine,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        items: (routine.items ?? []).map((item: any) => {
          const { targetLoad, ...rest } = item
          const migratedLoad = migrateLoadTarget(targetLoad)
          const targetWeight =
            migratedLoad?.type === 'absolute' || migratedLoad?.type === 'bodyweight_plus'
              ? migratedLoad.weight
              : undefined
          return targetWeight ? { ...rest, targetWeight } : rest
        }),
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dailyWorkoutResults: (json.data?.dailyWorkoutResults ?? []).map((row: any) => ({
        ...row,
        entries: (row.entries ?? []).map(migrateEntry),
      })),
    },
  }
}

// schemaVersion 2 -> 3: dailyExerciseLogs pindah dari { exerciseIds: string[] }
// ke { entries: WorkoutResultEntry[] } — persis bentuk dailyWorkoutResults —
// supaya target set/rep/beban/durasi ikut tersimpan. Baris lama diisi nilai
// 0 karena file lama tidak pernah menyimpan angka target sama sekali.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV2ToV3(json: any): unknown {
  return {
    ...json,
    schemaVersion: 3,
    data: {
      ...json.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dailyExerciseLogs: (json.data?.dailyExerciseLogs ?? []).map((row: any) => {
        if (Array.isArray(row.entries)) return row
        const ids: string[] = row.exerciseIds ?? []
        const rest = { ...row }
        delete rest.exerciseIds
        return {
          ...rest,
          entries: ids.map((exerciseId) => ({
            exerciseId,
            sets: 0,
            reps: 0,
            weight: { value: 0, unit: 'kg' },
            durationSec: 0,
          })),
        }
      }),
    },
  }
}

// schemaVersion 3 -> 4: dailyWorkoutResults pindah primary key dari `date`
// ke `id` (lihat catatan di db/schema.ts) — supaya satu tanggal bisa punya
// lebih dari satu sesi latihan. Baris lama dikasih id baru + createdAt
// perkiraan (tengah hari pada tanggalnya, tidak ada waktu asli yang bisa
// dipulihkan dari data lama).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV3ToV4(json: any): unknown {
  return {
    ...json,
    schemaVersion: 4,
    data: {
      ...json.data,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dailyWorkoutResults: (json.data?.dailyWorkoutResults ?? []).map((row: any) => {
        if (typeof row.id === 'string') return row
        return {
          ...row,
          id: ulid(),
          createdAt: `${row.date}T12:00:00.000Z`,
        }
      }),
    },
  }
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

// dailyExerciseLogs tidak punya field Auditable (cuma keyed oleh tanggal,
// tanpa updatedAt) — jadi "gabungkan" berarti: tanggal baru ditambahkan,
// tanggal yang sudah ada ditimpa isi dari file (tidak ada timestamp yang
// bisa dibandingkan untuk tahu mana yang lebih baru).
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

// dailyWorkoutResults keyed oleh `id` dan bersifat immutable (satu sesi
// yang sudah tersimpan tidak pernah diedit lagi) — jadi "gabungkan" di sini
// sederhana: id yang belum ada ditambahkan, id yang sudah ada dilewati
// (sudah persis sama, tidak ada yang perlu ditimpa).
async function mergeById<T extends { id: string }>(
  table: MergeableTable<T>,
  incoming: T[],
  summary: ImportSummary,
): Promise<void> {
  for (const record of incoming) {
    const existing = await table.get(record.id)
    if (!existing) {
      await table.add(record)
      summary.added += 1
    } else {
      summary.skipped += 1
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
          db.routines.bulkAdd(file.data.routines as SimpleRoutine[]),
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
      await mergeAuditable<SimpleRoutine>(
        db.routines,
        file.data.routines as SimpleRoutine[],
        summary,
      )
      await mergeByDateKey<DailyExerciseLog>(
        db.dailyExerciseLogs,
        file.data.dailyExerciseLogs,
        summary,
      )
      await mergeById<DailyWorkoutResult>(
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
