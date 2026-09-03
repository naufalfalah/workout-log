import { useLiveQuery } from 'dexie-react-hooks'
import { db, type DailyWorkoutResult, type WorkoutResultEntry } from '../../db/schema'

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
