import type { Equipment, Exercise, MeasurementType, MuscleGroup } from '../domain/types'

export const equipmentOptions: Equipment[] = [
  'barbell',
  'dumbbell',
  'kettlebell',
  'machine',
  'cable',
  'bodyweight',
  'band',
  'rings',
  'cardio_machine',
  'other',
]

export const muscleOptions: MuscleGroup[] = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
  'full_body',
]

export const measurementLabels: Record<MeasurementType, string> = {
  weight_reps: 'Beban (kg) + reps',
  reps: 'Reps',
  weighted_bodyweight: 'Beban tambahan + reps',
  assisted_reps: 'Beban bantuan + reps',
  duration: 'Durasi (detik)',
  weighted_duration: 'Beban + durasi',
  distance_duration: 'Jarak + durasi',
  reps_distance: 'Reps + jarak',
}

const weightedMeasurements: MeasurementType[] = [
  'weight_reps',
  'weighted_bodyweight',
  'weighted_duration',
]

export function hasWeightField(measurement: MeasurementType): boolean {
  return weightedMeasurements.includes(measurement)
}

const repsMeasurements: MeasurementType[] = [
  'weight_reps',
  'reps',
  'weighted_bodyweight',
  'assisted_reps',
  'reps_distance',
]

export function hasRepsField(measurement: MeasurementType): boolean {
  return repsMeasurements.includes(measurement)
}

const durationMeasurements: MeasurementType[] = [
  'duration',
  'weighted_duration',
  'distance_duration',
]

export function hasDurationField(measurement: MeasurementType): boolean {
  return durationMeasurements.includes(measurement)
}

// Ringkasan nilai default gerakan untuk ditampilkan di daftar/detail,
// mis. "5×5 · 60 kg" atau "3×45 dtk".
export function formatExerciseDefaults(exercise: Exercise): string | null {
  const { defaultSets, defaultReps, defaultDurationSec, defaultWeightKg } = exercise
  const parts: string[] = []

  if (defaultSets && defaultReps) {
    parts.push(`${defaultSets}×${defaultReps}`)
  } else if (defaultSets && defaultDurationSec) {
    parts.push(`${defaultSets}×${defaultDurationSec} dtk`)
  } else if (defaultReps) {
    parts.push(`${defaultReps} rep`)
  } else if (defaultDurationSec) {
    parts.push(`${defaultDurationSec} dtk`)
  } else if (defaultSets) {
    parts.push(`${defaultSets} set`)
  }

  if (defaultWeightKg) {
    parts.push(`${defaultWeightKg} kg`)
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

// Ringkasan satu entri hasil latihan, mis. "5 set · 5 rep · 60 kg" atau
// "3 set · 45 dtk" — dipakai di mana pun entri WorkoutResultEntry
// ditampilkan (Riwayat, kalender Beranda).
export function formatWorkoutEntrySummary(
  entry: { sets: number; reps: number; weightKg: number; durationSec: number },
  exercise: Exercise | undefined,
): string {
  if (!exercise) return ''
  const parts: string[] = []
  if (entry.sets > 0) parts.push(`${entry.sets} set`)
  if (hasRepsField(exercise.measurement) && entry.reps > 0) {
    parts.push(`${entry.reps} rep`)
  }
  if (hasWeightField(exercise.measurement) && entry.weightKg > 0) {
    parts.push(`${entry.weightKg} kg`)
  }
  if (hasDurationField(exercise.measurement) && entry.durationSec > 0) {
    parts.push(`${entry.durationSec} dtk`)
  }
  return parts.join(' · ')
}

export function label(value: string): string {
  return value
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ')
}
