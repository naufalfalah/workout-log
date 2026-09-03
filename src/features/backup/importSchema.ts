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

const simpleRoutineItem = z.object({
  id: z.string(),
  exerciseId: z.string(),
  targetSets: z.number().optional(),
  targetReps: z.number().optional(),
  targetWeight: weightSchema.optional(),
  targetDurationSec: z.number().optional(),
  restSec: z.number().optional(),
  notes: z.string().optional(),
})

const simpleRoutineSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()),
  items: z.array(simpleRoutineItem),
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
    routines: z.array(simpleRoutineSchema).default([]),
    dailyExerciseLogs: z.array(dailyExerciseLogSchema).default([]),
    dailyWorkoutResults: z.array(dailyWorkoutResultSchema).default([]),
  }),
})

export type ImportFile = z.infer<typeof importFileSchema>
export type ImportedExercise = z.infer<typeof exerciseSchema>
export type ImportedRoutine = z.infer<typeof simpleRoutineSchema>
