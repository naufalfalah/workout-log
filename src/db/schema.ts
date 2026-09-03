import Dexie, { type EntityTable } from 'dexie'

import type { Exercise, Routine, Weight } from '@/domain/types'

// Gerakan yang dilatih pada satu tanggal. Sengaja menyimpan daftar
// exerciseId (disalin, bukan referensi ke Routine) supaya riwayat harian
// tidak ikut berubah kalau routine sumbernya diedit atau dihapus nanti.
export interface DailyExerciseLog {
  date: string // 'yyyy-MM-dd'
  exerciseIds: string[]
}

export interface WorkoutResultEntry {
  exerciseId: string
  sets: number
  reps: number
  weight: Weight
  durationSec: number
}

// Hasil latihan sungguhan (set/rep/beban yang dicatat pengguna) untuk satu
// tanggal. Terpisah dari DailyExerciseLog (rencana gerakan) supaya
// merencanakan hari ini tidak langsung dianggap sudah dikerjakan.
export interface DailyWorkoutResult {
  date: string // 'yyyy-MM-dd'
  entries: WorkoutResultEntry[]
}

// Tabel sementara: nilai target (set/rep/beban/durasi) hasil terjemahan dari
// RoutineItem routine yang dipilih di /session, dikirim ke /session/active
// sebagai nilai awal input numerik. Baris dihapus begitu sesi difinalisasi
// atau dibatalkan — tidak dianggap data historis, jadi tidak ikut ekspor/impor.
export interface DailyPlannedTargets {
  date: string // 'yyyy-MM-dd'
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
    routines: Routine[]
    dailyExerciseLogs: DailyExerciseLog[]
    dailyWorkoutResults: DailyWorkoutResult[]
  }
}

class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  dailyExerciseLogs!: EntityTable<DailyExerciseLog, 'date'>
  dailyWorkoutResults!: EntityTable<DailyWorkoutResult, 'date'>
  dailyPlannedTargets!: EntityTable<DailyPlannedTargets, 'date'>
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
  }
}

export const db = new WorkoutDB()

// 'populate' hanya berjalan sekali, saat database dibuat pertama kali
// db.on('populate', () => {
//   db.exercises.bulkAdd(exercisesSeed)
//   db.routines.bulkAdd(routinesSeed())
// })
