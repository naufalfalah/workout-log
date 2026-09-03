import { useLiveQuery } from 'dexie-react-hooks'

import { db, type DailyWorkoutResult, type WorkoutResultEntry } from '@/db/schema'

// Lihat catatan di dailyExerciseLogs.store.ts soal 'loading' vs null.
export function useDailyWorkoutResult(dateKey: string): DailyWorkoutResult | null | 'loading' {
  return useLiveQuery(
    async () => (await db.dailyWorkoutResults.get(dateKey)) ?? null,
    [dateKey],
    'loading' as const,
  )
}

// Set tanggal yang punya hasil latihan tersimpan — dipakai untuk menandai
// kalender di Beranda, tanpa perlu memuat seluruh isi entries di sana.
export function useDailyWorkoutResultDates(): Set<string> {
  const rows = useLiveQuery(() => db.dailyWorkoutResults.toArray(), []) ?? []
  return new Set(rows.map((row) => row.date))
}

// Diurutkan dari tanggal terbaru ke terlama (format 'yyyy-MM-dd')
export async function fetchDailyWorkoutResultsPage(
  offset: number,
  limit: number,
): Promise<DailyWorkoutResult[]> {
  return db.dailyWorkoutResults.orderBy('date').reverse().offset(offset).limit(limit).toArray()
}

// Untuk tiap exerciseId, cari entri terakhir yang bukan kosong dari hasil
// latihan tanggal sebelumnya (terbaru dulu). Dipakai untuk mengisi nilai
// default saat sesi baru dimulai, sesuai spesifikasi: "angka terisi otomatis
// dari sesi sebelumnya".
export async function fetchLastEntries(
  exerciseIds: string[],
  beforeDateKey: string,
): Promise<Map<string, WorkoutResultEntry>> {
  const remaining = new Set(exerciseIds)
  const result = new Map<string, WorkoutResultEntry>()
  if (remaining.size === 0) return result

  await db.dailyWorkoutResults
    .where('date')
    .below(beforeDateKey)
    .reverse()
    .until(() => remaining.size === 0)
    .each((row) => {
      for (const entry of row.entries) {
        if (!remaining.has(entry.exerciseId)) continue
        if (
          entry.sets === 0 &&
          entry.reps === 0 &&
          entry.weight.value === 0 &&
          entry.durationSec === 0
        ) {
          continue
        }
        result.set(entry.exerciseId, entry)
        remaining.delete(entry.exerciseId)
      }
    })

  return result
}

export async function saveDailyWorkoutResult(
  dateKey: string,
  entries: WorkoutResultEntry[],
): Promise<void> {
  if (entries.length === 0) {
    await db.dailyWorkoutResults.delete(dateKey)
  } else {
    await db.dailyWorkoutResults.put({ date: dateKey, entries })
  }
}

export async function deleteDailyWorkoutResult(dateKey: string): Promise<void> {
  await db.dailyWorkoutResults.delete(dateKey)
}
