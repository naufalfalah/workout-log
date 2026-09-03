import { useLiveQuery } from 'dexie-react-hooks'
import { ulid } from 'ulid'

import { db } from '@/db/schema'
import type { Equipment, Exercise, MuscleGroup } from '@/domain/types'

export interface ExerciseDraft {
  name: string
  equipment: Equipment
  measurement: Exercise['measurement']
  primaryMuscles: MuscleGroup[]
  imageUrl?: string
  defaultSets?: number
  defaultReps?: number
  defaultWeightKg?: number
  defaultDurationSec?: number
}

export interface ExerciseDefaultsPatch {
  defaultSets?: number
  defaultReps?: number
  defaultWeightKg?: number
  defaultDurationSec?: number
}

export function useExercises(): Exercise[] {
  return useLiveQuery(() => db.exercises.toArray(), []) ?? []
}

export function useExercise(id: string | undefined): Exercise | undefined {
  return useLiveQuery(() => (id ? db.exercises.get(id) : undefined), [id])
}

export async function addExercise(draft: ExerciseDraft): Promise<string> {
  const now = new Date().toISOString()
  const id = ulid()
  const exercise: Exercise = {
    id,
    ...draft,
    isCustom: true,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  }
  await db.exercises.add(exercise)
  return id
}

export async function setExerciseImage(id: string, imageUrl: string | undefined): Promise<void> {
  await db.exercises.update(id, {
    imageUrl,
    updatedAt: new Date().toISOString(),
  })
}

export async function updateExerciseDefaults(
  id: string,
  patch: ExerciseDefaultsPatch,
): Promise<void> {
  await db.exercises.update(id, {
    ...patch,
    updatedAt: new Date().toISOString(),
  })
}
