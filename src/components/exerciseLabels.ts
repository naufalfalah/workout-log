import type {
  Equipment,
  Exercise,
  MeasurementType,
  MuscleGroup,
  RoutineItem,
  Weight,
} from '@/domain/types'

function formatWeight(weight: Weight): string {
  return `${weight.value} ${weight.unit}`
}

export const equipmentOptions: Equipment[] = [
  'none',
  'barbell',
  'dumbbell',
  'kettlebell',
  'machine',
  'cable',
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

export function formatExerciseDefaults(exercise: Exercise): string | null {
  const { defaultSets, defaultReps, defaultDurationSec, defaultWeight } = exercise
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

  if (defaultWeight && defaultWeight.value > 0) {
    parts.push(formatWeight(defaultWeight))
  }

  return parts.length > 0 ? parts.join(' · ') : null
}

function formatRepTarget(target: RoutineItem['targetReps']): string | null {
  if (!target) return null
  switch (target.type) {
    case 'fixed':
      return `${target.value} rep`
    case 'range':
      return `${target.min}-${target.max} rep`
    case 'amrap':
      return 'AMRAP'
    case 'time':
      return `${target.seconds} dtk`
  }
}

function formatLoadTarget(target: RoutineItem['targetLoad']): string | null {
  if (!target) return null
  switch (target.type) {
    case 'absolute':
      return formatWeight(target.weight)
    case 'percent_1rm':
      return `${target.percent}% 1RM`
    case 'rpe':
      return `RPE ${target.value}`
    case 'bodyweight':
      return 'Bodyweight'
    case 'bodyweight_plus':
      return `BW +${formatWeight(target.weight)}`
  }
}

export function formatRoutineItemTarget(item: RoutineItem): string | null {
  const parts: string[] = []
  const repsLabel = formatRepTarget(item.targetReps)

  if (item.targetSets && repsLabel) {
    parts.push(`${item.targetSets}×${repsLabel}`)
  } else if (item.targetSets && item.targetDurationSec) {
    parts.push(`${item.targetSets}×${item.targetDurationSec} dtk`)
  } else if (repsLabel) {
    parts.push(repsLabel)
  } else if (item.targetDurationSec) {
    parts.push(`${item.targetDurationSec} dtk`)
  } else if (item.targetSets) {
    parts.push(`${item.targetSets} set`)
  }

  const loadLabel = formatLoadTarget(item.targetLoad)
  if (loadLabel) parts.push(loadLabel)

  if (item.targetDistanceM) parts.push(`${item.targetDistanceM} m`)

  return parts.length > 0 ? parts.join(' · ') : null
}

// Ringkasan satu entri hasil latihan, mis. "5 set · 5 rep · 60 kg" atau
// "3 set · 45 dtk" — dipakai di mana pun entri WorkoutResultEntry
// ditampilkan (Riwayat, kalender Beranda).
export function formatWorkoutEntrySummary(
  entry: { sets: number; reps: number; weight: Weight; durationSec: number },
  exercise: Exercise | undefined,
): string {
  if (!exercise) return ''
  const parts: string[] = []
  if (entry.sets > 0) parts.push(`${entry.sets} set`)
  if (hasRepsField(exercise.measurement) && entry.reps > 0) {
    parts.push(`${entry.reps} rep`)
  }
  if (hasWeightField(exercise.measurement) && entry.weight.value > 0) {
    parts.push(formatWeight(entry.weight))
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
