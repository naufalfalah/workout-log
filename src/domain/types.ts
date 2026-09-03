export type ID = string // ULID, urut berdasarkan waktu
export type ISODate = string // "2026-09-02T07:30:00.000Z"

export interface Auditable {
  createdAt: ISODate
  updatedAt: ISODate
  deletedAt?: ISODate
}

export type MeasurementType =
  | 'weight_reps'
  | 'reps'
  | 'weighted_bodyweight'
  | 'assisted_reps'
  | 'duration'
  | 'weighted_duration'
  | 'distance_duration'
  | 'reps_distance'

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full_body'

export type Equipment =
  | 'none'
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'band'
  | 'rings'
  | 'cardio_machine'
  | 'other'

export type WeightUnit = 'kg' | 'lb'

export interface Weight {
  value: number
  unit: WeightUnit
}

export interface Exercise extends Auditable {
  id: ID
  name: string
  aliases?: string[]
  equipment: Equipment
  measurement: MeasurementType
  primaryMuscles: MuscleGroup[]
  secondaryMuscles?: MuscleGroup[]
  imageUrl?: string // satu gambar per gerakan; data URL selama belum ada penyimpanan file
  // personalize
  defaultSets?: number
  defaultReps?: number // relevan untuk measurement yang punya komponen reps
  defaultWeight?: Weight // relevan untuk measurement yang punya komponen beban
  defaultDurationSec?: number // relevan untuk measurement yang punya komponen durasi
  defaultRestSec?: number
  // status
  isCustom: boolean
  isArchived: boolean
  notes?: string
}

export interface SimpleRoutineItem {
  id: ID
  exerciseId: ID
  // personalize
  targetSets?: number
  targetReps?: RepTarget
  targetWeight?: Weight
  targetDurationSec?: number
  restSec?: number
  // status
  notes?: string
}

export interface SimpleRoutine extends Auditable {
  id: ID
  name: string
  description?: string
  tags: string[]
  items: SimpleRoutineItem[]
}

export type RepTarget =
  | { type: 'fixed'; value: number }
  | { type: 'range'; min: number; max: number } // "8-12"
  | { type: 'amrap' } // sebanyak mungkin
  | { type: 'time'; seconds: number }

export type LoadTarget =
  | { type: 'absolute'; weight: Weight }
  | { type: 'percent_1rm'; percent: number }
  | { type: 'rpe'; value: number } // 6 sampai 10, boleh 0.5
  | { type: 'bodyweight' }
  | { type: 'bodyweight_plus'; weight: Weight }

export interface RoutineItem {
  id: ID
  exerciseId: ID
  targetSets?: number // hanya untuk straight/superset
  targetReps?: RepTarget
  targetLoad?: LoadTarget
  targetDurationSec?: number
  targetDistanceM?: number
  tempo?: string // "3-1-1-0"
  restSec?: number
  notes?: string
}

export type BlockConfig =
  | { kind: 'straight' }
  | { kind: 'superset'; restBetweenPairsSec?: number }
  | { kind: 'circuit'; rounds: number; restBetweenRoundsSec?: number }
  | { kind: 'amrap'; timeCapSec: number }
  | { kind: 'emom'; intervalSec: number; totalIntervals: number }
  | { kind: 'for_time'; rounds: number; timeCapSec?: number }
  | { kind: 'interval'; workSec: number; restSec: number; rounds: number }

export interface RoutineBlock {
  id: ID
  label?: string // "A1", "Metcon", "Finisher"
  config: BlockConfig
  items: RoutineItem[]
  restAfterSec?: number
  notes?: string
}

export interface Routine extends Auditable {
  id: ID
  name: string
  description?: string
  tags: string[] // "push", "metcon", "upper"
  blocks: RoutineBlock[]
  estimatedDurationMin?: number
  lastPerformedAt?: ISODate
  timesPerformed: number
}
