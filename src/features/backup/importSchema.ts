import { z } from 'zod'

// Cermin persis domain/types.ts + db/schema.ts, dipakai untuk memvalidasi
// file impor sebelum menyentuh database sama sekali (bagian 8.2 spesifikasi).
const isoDate = z.string()

const measurementType = z.enum([
  'weight_reps',
  'reps',
  'weighted_bodyweight',
  'assisted_reps',
  'duration',
  'weighted_duration',
  'distance_duration',
  'reps_distance',
])

const muscleGroup = z.enum([
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
])

const equipment = z.enum([
  'none',
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
])

const weightUnit = z.enum(['kg', 'lb'])

const weightSchema = z.object({
  value: z.number(),
  unit: weightUnit,
})

const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).optional(),
  equipment,
  measurement: measurementType,
  primaryMuscles: z.array(muscleGroup),
  secondaryMuscles: z.array(muscleGroup).optional(),
  imageUrl: z.string().optional(),
  defaultSets: z.number().optional(),
  defaultReps: z.number().optional(),
  defaultWeight: weightSchema.optional(),
  defaultDurationSec: z.number().optional(),
  defaultRestSec: z.number().optional(),
  isCustom: z.boolean(),
  isArchived: z.boolean(),
  notes: z.string().optional(),
  createdAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.optional(),
})

const repTarget = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed'), value: z.number() }),
  z.object({ type: z.literal('range'), min: z.number(), max: z.number() }),
  z.object({ type: z.literal('amrap') }),
  z.object({ type: z.literal('time'), seconds: z.number() }),
])

const loadTarget = z.discriminatedUnion('type', [
  z.object({ type: z.literal('absolute'), weight: weightSchema }),
  z.object({ type: z.literal('percent_1rm'), percent: z.number() }),
  z.object({ type: z.literal('rpe'), value: z.number() }),
  z.object({ type: z.literal('bodyweight') }),
  z.object({ type: z.literal('bodyweight_plus'), weight: weightSchema }),
])

const routineItem = z.object({
  id: z.string(),
  exerciseId: z.string(),
  targetSets: z.number().optional(),
  targetReps: repTarget.optional(),
  targetLoad: loadTarget.optional(),
  targetDurationSec: z.number().optional(),
  targetDistanceM: z.number().optional(),
  tempo: z.string().optional(),
  restSec: z.number().optional(),
  notes: z.string().optional(),
})

const blockConfig = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('straight') }),
  z.object({ kind: z.literal('superset'), restBetweenPairsSec: z.number().optional() }),
  z.object({
    kind: z.literal('circuit'),
    rounds: z.number(),
    restBetweenRoundsSec: z.number().optional(),
  }),
  z.object({ kind: z.literal('amrap'), timeCapSec: z.number() }),
  z.object({ kind: z.literal('emom'), intervalSec: z.number(), totalIntervals: z.number() }),
  z.object({ kind: z.literal('for_time'), rounds: z.number(), timeCapSec: z.number().optional() }),
  z.object({
    kind: z.literal('interval'),
    workSec: z.number(),
    restSec: z.number(),
    rounds: z.number(),
  }),
])

const routineBlock = z.object({
  id: z.string(),
  label: z.string().optional(),
  config: blockConfig,
  items: z.array(routineItem),
  restAfterSec: z.number().optional(),
  notes: z.string().optional(),
})

const routineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  blocks: z.array(routineBlock),
  estimatedDurationMin: z.number().optional(),
  lastPerformedAt: isoDate.optional(),
  timesPerformed: z.number(),
  createdAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.optional(),
})

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus yyyy-MM-dd')

const dailyExerciseLogSchema = z.object({
  date: dateKey,
  exerciseIds: z.array(z.string()),
})

const workoutResultEntrySchema = z.object({
  exerciseId: z.string(),
  sets: z.number(),
  reps: z.number(),
  weight: weightSchema,
  durationSec: z.number(),
})

const dailyWorkoutResultSchema = z.object({
  date: dateKey,
  entries: z.array(workoutResultEntrySchema),
})

export const importFileSchema = z.object({
  schema: z.literal('workout-log.export'),
  schemaVersion: z.number(),
  exportedAt: z.string(),
  counts: z.record(z.string(), z.number()).optional(),
  data: z.object({
    exercises: z.array(exerciseSchema).default([]),
    routines: z.array(routineSchema).default([]),
    dailyExerciseLogs: z.array(dailyExerciseLogSchema).default([]),
    dailyWorkoutResults: z.array(dailyWorkoutResultSchema).default([]),
  }),
})

export type ImportFile = z.infer<typeof importFileSchema>
export type ImportedExercise = z.infer<typeof exerciseSchema>
export type ImportedRoutine = z.infer<typeof routineSchema>
