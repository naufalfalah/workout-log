import Dexie, { type EntityTable } from 'dexie'
import { ulid } from 'ulid'

import type { Exercise, SimpleRoutine, Weight } from '@/domain/types'

export interface WorkoutResultEntry {
  exerciseId: string
  sets: number
  reps: number
  weight: Weight
  durationSec: number
}

// Rencana gerakan untuk satu tanggal — bentuknya persis DailyWorkoutResult
// (array WorkoutResultEntry) supaya target set/rep/beban/durasi (dari
// routine yang dipilih, atau nilai default gerakan) sudah terisi begitu
// pengguna sampai di /session/active, bukan mulai dari nol. Terpisah dari
// DailyWorkoutResult supaya merencanakan hari ini tidak langsung dianggap
// sudah dikerjakan — exerciseId disalin (bukan referensi ke Routine) supaya
// riwayat harian tidak ikut berubah kalau routine sumbernya diedit/dihapus.
export interface DailyExerciseLog {
  date: string // 'yyyy-MM-dd'
  entries: WorkoutResultEntry[]
}

// Hasil latihan sungguhan (set/rep/beban yang dicatat pengguna). Terpisah
// dari DailyExerciseLog (rencana gerakan) supaya merencanakan hari ini
// tidak langsung dianggap sudah dikerjakan. Primary key-nya `id` (bukan
// `date`) supaya satu tanggal bisa punya lebih dari satu sesi — `date`
// jadi field biasa (terindeks) untuk kueri kalender/riwayat per tanggal,
// dan `createdAt` dipakai untuk urutan kronologis (termasuk kalau ada
// beberapa sesi di tanggal yang sama).
export interface DailyWorkoutResult {
  id: string // ULID
  date: string // 'yyyy-MM-dd'
  createdAt: string // ISODate
  entries: WorkoutResultEntry[]
}

export interface AppSettings {
  id: 'app'
  lastExportAt?: string // ISODate
}

// Snapshot sekali pakai dari seluruh data sebelum impor dijalankan (bagian
// 8.2 spesifikasi) — supaya impor yang keliru masih bisa dipulihkan. Baris
// tunggal (id selalu 'latest'), ditimpa tiap kali impor baru dijalankan.
export interface RecoverySnapshot {
  id: 'latest'
  createdAt: string // ISODate
  data: {
    exercises: Exercise[]
    routines: SimpleRoutine[]
    dailyExerciseLogs: DailyExerciseLog[]
    dailyWorkoutResults: DailyWorkoutResult[]
  }
}

class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<SimpleRoutine, 'id'>
  dailyExerciseLogs!: EntityTable<DailyExerciseLog, 'date'>
  dailyWorkoutResults!: EntityTable<DailyWorkoutResult, 'id'>
  settings!: EntityTable<AppSettings, 'id'>
  recoverySnapshot!: EntityTable<RecoverySnapshot, 'id'>

  constructor() {
    super('workout-log')
    this.version(1).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
    })
    this.version(2).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
    })
    this.version(3).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
      dailyWorkoutResults: 'date',
    })
    this.version(4).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
      dailyWorkoutResults: 'date',
      settings: 'id',
    })
    this.version(5).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
      dailyWorkoutResults: 'date',
      settings: 'id',
      recoverySnapshot: 'id',
    })
    this.version(6).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
      dailyWorkoutResults: 'date',
      dailyPlannedTargets: 'date',
      settings: 'id',
      recoverySnapshot: 'id',
    })
    // Beban pindah dari selalu-kg (mis. weightKg / kg) ke {value, unit} —
    // baris lama dikonversi ke unit 'kg' apa adanya, karena itu satu-satunya
    // unit yang pernah dipakai sebelum migrasi ini.
    this.version(7)
      .stores({
        exercises: 'id, name, equipment, isCustom, updatedAt',
        routines: 'id, name, *tags, updatedAt, lastPerformedAt',
        dailyExerciseLogs: 'date',
        dailyWorkoutResults: 'date',
        dailyPlannedTargets: 'date',
        settings: 'id',
        recoverySnapshot: 'id',
      })
      .upgrade(async (tx) => {
        const toWeight = (kg: unknown): Weight => ({
          value: typeof kg === 'number' ? kg : 0,
          unit: 'kg',
        })

        await tx
          .table('exercises')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((exercise: any) => {
            const kg = exercise.defaultWeightKg
            delete exercise.defaultWeightKg
            if (typeof kg === 'number') exercise.defaultWeight = toWeight(kg)
          })

        await tx
          .table('routines')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((routine: any) => {
            for (const block of routine.blocks ?? []) {
              for (const item of block.items ?? []) {
                const target = item.targetLoad
                if (target && (target.type === 'absolute' || target.type === 'bodyweight_plus')) {
                  const kg = target.kg
                  delete target.kg
                  target.weight = toWeight(kg)
                }
              }
            }
          })

        await tx
          .table('dailyWorkoutResults')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((row: any) => {
            for (const entry of row.entries ?? []) {
              const kg = entry.weightKg
              delete entry.weightKg
              entry.weight = toWeight(kg)
            }
          })

        await tx
          .table('dailyPlannedTargets')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((row: any) => {
            for (const entry of row.entries ?? []) {
              const kg = entry.weightKg
              delete entry.weightKg
              entry.weight = toWeight(kg)
            }
          })
      })
    // DailyExerciseLog sekarang menyimpan entries: WorkoutResultEntry[]
    // (persis bentuk DailyWorkoutResult) alih-alih exerciseIds: string[],
    // supaya target set/rep/beban/durasi sudah terisi begitu sampai di
    // /session/active. dailyPlannedTargets jadi tidak diperlukan lagi
    // (fungsinya sudah tercakup langsung di dailyExerciseLogs) — dihapus.
    this.version(8)
      .stores({
        exercises: 'id, name, equipment, isCustom, updatedAt',
        routines: 'id, name, *tags, updatedAt, lastPerformedAt',
        dailyExerciseLogs: 'date',
        dailyWorkoutResults: 'date',
        dailyPlannedTargets: null,
        settings: 'id',
        recoverySnapshot: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('dailyExerciseLogs')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((row: any) => {
            const ids: string[] = row.exerciseIds ?? []
            delete row.exerciseIds
            row.entries = ids.map((exerciseId) => ({
              exerciseId,
              sets: 0,
              reps: 0,
              weight: { value: 0, unit: 'kg' },
              durationSec: 0,
            }))
          })
      })
    // dailyWorkoutResults pindah primary key dari `date` ke `id`, supaya
    // satu tanggal bisa punya lebih dari satu sesi latihan. IndexedDB tidak
    // bisa mengubah keyPath store yang sudah ada di tempat — harus lewat
    // tabel sementara (`dailyWorkoutResultsTmp`) lalu dipindahkan kembali
    // ke nama semula di 2 versi berikutnya, supaya data lama tidak hilang:
    //   v9  — tabel lama (`date`) TETAP ada (datanya aman), tabel baru
    //         dibuat dengan nama sementara, isi lama disalin ke sana
    //         sambil dikasih `id` + `createdAt`.
    //   v10 — tabel lama akhirnya dihapus (isinya sudah aman di tabel
    //         sementara).
    //   v11 — tabel dengan nama asli dibuat lagi (kali ini keyPath `id`),
    //         isi dipindah balik dari tabel sementara, tabel sementara
    //         dihapus.
    this.version(9)
      .stores({
        exercises: 'id, name, equipment, isCustom, updatedAt',
        routines: 'id, name, *tags, updatedAt, lastPerformedAt',
        dailyExerciseLogs: 'date',
        dailyWorkoutResults: 'date',
        dailyWorkoutResultsTmp: 'id, date, createdAt',
        settings: 'id',
        recoverySnapshot: 'id',
      })
      .upgrade(async (tx) => {
        const old = await tx.table('dailyWorkoutResults').toArray()
        const now = new Date().toISOString()
        await tx.table('dailyWorkoutResultsTmp').bulkAdd(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          old.map((row: any) => ({
            id: ulid(),
            date: row.date,
            createdAt: now,
            entries: row.entries,
          })),
        )
      })
    this.version(10).stores({
      exercises: 'id, name, equipment, isCustom, updatedAt',
      routines: 'id, name, *tags, updatedAt, lastPerformedAt',
      dailyExerciseLogs: 'date',
      dailyWorkoutResults: null,
      dailyWorkoutResultsTmp: 'id, date, createdAt',
      settings: 'id',
      recoverySnapshot: 'id',
    })
    this.version(11)
      .stores({
        exercises: 'id, name, equipment, isCustom, updatedAt',
        routines: 'id, name, *tags, updatedAt, lastPerformedAt',
        dailyExerciseLogs: 'date',
        dailyWorkoutResults: 'id, date, createdAt',
        dailyWorkoutResultsTmp: null,
        settings: 'id',
        recoverySnapshot: 'id',
      })
      .upgrade(async (tx) => {
        const rows = await tx.table('dailyWorkoutResultsTmp').toArray()
        await tx.table('dailyWorkoutResults').bulkAdd(rows)
      })
    // Routine peninggalan model lama (blocks[].items, lihat v7) belum pernah
    // dipindahkan ke bentuk items[] datar saat SimpleRoutine disederhanakan —
    // record itu nyangkut tanpa field `items` sama sekali dan bikin setiap
    // `routine.items.some(...)` di kode terbaru meledak. Migrasi ini
    // meratakan blocks[].items yang tersisa jadi items[], atau setidaknya
    // menjamin field items selalu berupa array.
    this.version(12)
      .stores({
        exercises: 'id, name, equipment, isCustom, updatedAt',
        routines: 'id, name, *tags, updatedAt, lastPerformedAt',
        dailyExerciseLogs: 'date',
        dailyWorkoutResults: 'id, date, createdAt',
        settings: 'id',
        recoverySnapshot: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('routines')
          .toCollection()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .modify((routine: any) => {
            if (Array.isArray(routine.items)) return
            const blocks = routine.blocks ?? []
            routine.items = blocks.flatMap((block: any) => block.items ?? [])
            delete routine.blocks
          })
      })
  }
}

export const db = new WorkoutDB()
