import { useLiveQuery } from 'dexie-react-hooks'
import { ulid } from 'ulid'

import { db, type DailyWorkoutResult, type WorkoutResultEntry } from '@/db/schema'

// Semua sesi yang tersimpan untuk satu tanggal, terurut dari yang paling
// awal dikerjakan — satu tanggal bisa punya lebih dari satu sesi (lihat
// catatan di db/schema.ts soal DailyWorkoutResult.id).
export function useDailyWorkoutResultsForDate(dateKey: string): DailyWorkoutResult[] | 'loading' {
  return (
    useLiveQuery(
      () => db.dailyWorkoutResults.where('date').equals(dateKey).sortBy('createdAt'),
      [dateKey],
    ) ?? 'loading'
  )
}

// Set tanggal yang punya hasil latihan tersimpan — dipakai untuk menandai
// kalender di Beranda, tanpa perlu memuat seluruh isi entries di sana.
// Beberapa sesi di tanggal yang sama otomatis menyatu jadi satu entri Set.
export function useDailyWorkoutResultDates(): Set<string> {
  const rows = useLiveQuery(() => db.dailyWorkoutResults.toArray(), []) ?? []
  return new Set(rows.map((row) => row.date))
}

export function useDailyWorkoutResult(id: string): DailyWorkoutResult | null | 'loading' {
  return useLiveQuery(
    async () => (await db.dailyWorkoutResults.get(id)) ?? null,
    [id],
    'loading' as const,
  )
}

// Diurutkan dari yang paling baru dikerjakan ke yang paling lama — dipakai
// createdAt (bukan date) supaya beberapa sesi di tanggal yang sama tetap
// terurut benar relatif satu sama lain.
export async function fetchDailyWorkoutResultsPage(
  offset: number,
  limit: number,
): Promise<DailyWorkoutResult[]> {
  return db.dailyWorkoutResults.orderBy('createdAt').reverse().offset(offset).limit(limit).toArray()
}

// Untuk tiap exerciseId, cari entri terakhir yang bukan kosong dari sesi
// sebelumnya (terbaru dulu, lintas tanggal). Dipakai untuk mengisi nilai
// default saat sesi baru dimulai, sesuai spesifikasi: "angka terisi otomatis
// dari sesi sebelumnya".
export async function fetchLastEntries(
  exerciseIds: string[],
): Promise<Map<string, WorkoutResultEntry>> {
  const remaining = new Set(exerciseIds)
  const result = new Map<string, WorkoutResultEntry>()
  if (remaining.size === 0) return result

  await db.dailyWorkoutResults
    .orderBy('createdAt')
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

// Selalu menyimpan sesi BARU (bukan menimpa sesi yang sudah ada di tanggal
// itu) — inilah yang memungkinkan lebih dari satu sesi latihan per hari.
export async function saveDailyWorkoutResult(
  dateKey: string,
  entries: WorkoutResultEntry[],
): Promise<void> {
  if (entries.length === 0) return
  await db.dailyWorkoutResults.add({
    id: ulid(),
    date: dateKey,
    createdAt: new Date().toISOString(),
    entries,
  })
}

export async function deleteDailyWorkoutResult(id: string): Promise<void> {
  await db.dailyWorkoutResults.delete(id)
}

export async function updateDailyWorkoutResultEntries(
  id: string,
  entries: WorkoutResultEntry[],
): Promise<void> {
  await db.dailyWorkoutResults.update(id, { entries })
}
