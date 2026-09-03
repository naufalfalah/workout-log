export type ID = string
export type ISODate = string

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

export interface Exercise extends Auditable {
  id: ID
  name: string
  aliases?: string[]
  equipment: Equipment
  measurement: MeasurementType
  primaryMuscles: MuscleGroup[]
  secondaryMuscles?: MuscleGroup[]
  imageUrl?: string // satu gambar per gerakan; data URL selama belum ada penyimpanan file
  defaultSets?: number
  defaultReps?: number // relevan untuk measurement yang punya komponen reps
  defaultWeightKg?: number // relevan untuk measurement yang punya komponen beban
  defaultDurationSec?: number // relevan untuk measurement yang punya komponen durasi
  defaultRestSec?: number
  isCustom: boolean
  isArchived: boolean
  notes?: string
}

export type RepTarget =
  | { type: 'fixed'; value: number }
  | { type: 'range'; min: number; max: number }
  | { type: 'amrap' }
  | { type: 'time'; seconds: number }

export type LoadTarget =
  | { type: 'absolute'; kg: number }
  | { type: 'percent_1rm'; percent: number }
  | { type: 'rpe'; value: number }
  | { type: 'bodyweight' }
  | { type: 'bodyweight_plus'; kg: number }

export interface RoutineItem {
  id: ID
  exerciseId: ID
  targetSets?: number
  targetReps?: RepTarget
  targetLoad?: LoadTarget
  targetDurationSec?: number
  targetDistanceM?: number
  tempo?: string
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
  label?: string
  config: BlockConfig
  items: RoutineItem[]
  restAfterSec?: number
  notes?: string
}

export interface Routine extends Auditable {
  id: ID
  name: string
  description?: string
  tags: string[]
  blocks: RoutineBlock[]
  estimatedDurationMin?: number
  lastPerformedAt?: ISODate
  timesPerformed: number
}
