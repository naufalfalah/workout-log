import Dexie, { type EntityTable } from 'dexie'
import type { Exercise, Routine } from '../domain/types'
import { exercisesSeed } from './seeders/exercises.seed'
import { routinesSeed } from '../db/seeders/routines.seed'

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
  weightKg: number
  durationSec: number
}

// Hasil latihan sungguhan (set/rep/beban yang dicatat pengguna) untuk satu
// tanggal. Terpisah dari DailyExerciseLog (rencana gerakan) supaya
// merencanakan hari ini tidak langsung dianggap sudah dikerjakan.
export interface DailyWorkoutResult {
  date: string // 'yyyy-MM-dd'
  entries: WorkoutResultEntry[]
}

export interface AppSettings {
  id: 'app'
  lastExportAt?: string // ISODate
}

class WorkoutDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>
  routines!: EntityTable<Routine, 'id'>
  dailyExerciseLogs!: EntityTable<DailyExerciseLog, 'date'>
  dailyWorkoutResults!: EntityTable<DailyWorkoutResult, 'date'>
  settings!: EntityTable<AppSettings, 'id'>

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
  }
}

export const db = new WorkoutDB()

// 'populate' hanya berjalan sekali, saat database dibuat pertama kali
db.on('populate', () => {
  db.exercises.bulkAdd(exercisesSeed)
  db.routines.bulkAdd(routinesSeed())
})
