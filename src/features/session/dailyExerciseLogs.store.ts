import { useLiveQuery } from 'dexie-react-hooks'

import { db, type DailyExerciseLog, type WorkoutResultEntry } from '@/db/schema'

// 'loading' = query belum selesai; null = sudah selesai, sungguh tidak ada
// data untuk tanggal ini. Dibedakan secara eksplisit karena Dexie.get()
// juga me-resolve ke undefined saat baris tidak ada, sehingga tidak bisa
// dipakai begitu saja untuk menandai "masih memuat".
export function useDailyExerciseLog(dateKey: string): DailyExerciseLog | null | 'loading' {
  return useLiveQuery(
    async () => (await db.dailyExerciseLogs.get(dateKey)) ?? null,
    [dateKey],
    'loading' as const,
  )
}

export async function saveDailyExerciseLog(
  dateKey: string,
  entries: WorkoutResultEntry[],
): Promise<void> {
  if (entries.length === 0) {
    await db.dailyExerciseLogs.delete(dateKey)
  } else {
    await db.dailyExerciseLogs.put({ date: dateKey, entries })
  }
}
