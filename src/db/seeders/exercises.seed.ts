import type { Exercise } from '@/domain/types'

// Seed kecil untuk pengembangan awal. Daftar lengkap 80-120 gerakan
// (bagian 4.2 spesifikasi) menyusul saat fitur Library Gerakan dibangun.
const now = new Date().toISOString()

interface Defaults {
  sets?: number
  reps?: number
  weightKg?: number
  durationSec?: number
}

function seed(
  id: string,
  name: string,
  equipment: Exercise['equipment'],
  measurement: Exercise['measurement'],
  primaryMuscles: Exercise['primaryMuscles'],
  defaults: Defaults = {},
): Exercise {
  return {
    id,
    name,
    equipment,
    measurement,
    primaryMuscles,
    isCustom: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
    defaultSets: defaults.sets,
    defaultReps: defaults.reps,
    defaultWeight:
      defaults.weightKg !== undefined ? { value: defaults.weightKg, unit: 'kg' } : undefined,
    defaultDurationSec: defaults.durationSec,
  }
}

// Nilai default di bawah cuma titik awal yang wajar untuk pemula —
// pengguna bisa mengubahnya lewat halaman detail gerakan.
export const exercisesSeed: Exercise[] = [
  seed('ex_back_squat', 'Back Squat', 'barbell', 'weight_reps', ['quads', 'glutes'], {
    sets: 5,
    reps: 5,
    weightKg: 60,
  }),
  seed('ex_bench_press', 'Bench Press', 'barbell', 'weight_reps', ['chest', 'triceps'], {
    sets: 5,
    reps: 5,
    weightKg: 40,
  }),
  seed('ex_deadlift', 'Deadlift', 'barbell', 'weight_reps', ['back', 'hamstrings'], {
    sets: 3,
    reps: 5,
    weightKg: 80,
  }),
  seed('ex_ohp', 'Overhead Press', 'barbell', 'weight_reps', ['shoulders', 'triceps'], {
    sets: 3,
    reps: 8,
    weightKg: 30,
  }),
  seed('ex_barbell_row', 'Barbell Row', 'barbell', 'weight_reps', ['back', 'biceps'], {
    sets: 3,
    reps: 8,
    weightKg: 40,
  }),
  seed('ex_db_curl', 'Dumbbell Curl', 'dumbbell', 'weight_reps', ['biceps'], {
    sets: 3,
    reps: 12,
    weightKg: 10,
  }),
  seed(
    'ex_db_shoulder_press',
    'Dumbbell Shoulder Press',
    'dumbbell',
    'weight_reps',
    ['shoulders'],
    { sets: 3, reps: 10, weightKg: 12 },
  ),
  seed('ex_lat_pulldown', 'Lat Pulldown', 'cable', 'weight_reps', ['back', 'biceps'], {
    sets: 3,
    reps: 10,
    weightKg: 40,
  }),
  seed('ex_leg_press', 'Leg Press', 'machine', 'weight_reps', ['quads', 'glutes'], {
    sets: 3,
    reps: 12,
    weightKg: 80,
  }),
  seed('ex_face_pull', 'Face Pull', 'cable', 'weight_reps', ['shoulders', 'back'], {
    sets: 3,
    reps: 15,
    weightKg: 15,
  }),
  seed('ex_pullup', 'Pull-up', 'bodyweight', 'reps', ['back', 'biceps'], { sets: 3, reps: 8 }),
  seed('ex_pushup', 'Push-up', 'bodyweight', 'reps', ['chest', 'triceps'], { sets: 3, reps: 15 }),
  seed('ex_air_squat', 'Air Squat', 'bodyweight', 'reps', ['quads', 'glutes'], {
    sets: 3,
    reps: 20,
  }),
  seed('ex_dip', 'Dip', 'bodyweight', 'weighted_bodyweight', ['chest', 'triceps'], {
    sets: 3,
    reps: 10,
  }),
  seed('ex_plank', 'Plank', 'bodyweight', 'duration', ['core'], { sets: 3, durationSec: 45 }),
  seed('ex_walking_lunge', 'Walking Lunge', 'bodyweight', 'reps', ['quads', 'glutes'], {
    sets: 3,
    reps: 20,
  }),
]
