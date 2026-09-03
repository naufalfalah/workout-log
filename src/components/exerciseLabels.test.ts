import { describe, expect, it } from 'vitest'
import type { Exercise } from '../domain/types'
import {
  formatExerciseDefaults,
  formatWorkoutEntrySummary,
  hasDurationField,
  hasRepsField,
  hasWeightField,
  label,
} from './exerciseLabels'

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex_1',
    name: 'Back Squat',
    equipment: 'barbell',
    measurement: 'weight_reps',
    primaryMuscles: ['quads', 'glutes'],
    isCustom: false,
    isArchived: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('hasWeightField / hasRepsField / hasDurationField', () => {
  it('mengenali measurement dengan komponen beban', () => {
    expect(hasWeightField('weight_reps')).toBe(true)
    expect(hasWeightField('weighted_bodyweight')).toBe(true)
    expect(hasWeightField('weighted_duration')).toBe(true)
    expect(hasWeightField('reps')).toBe(false)
    expect(hasWeightField('duration')).toBe(false)
  })

  it('mengenali measurement dengan komponen reps', () => {
    expect(hasRepsField('weight_reps')).toBe(true)
    expect(hasRepsField('reps_distance')).toBe(true)
    expect(hasRepsField('duration')).toBe(false)
  })

  it('mengenali measurement dengan komponen durasi', () => {
    expect(hasDurationField('duration')).toBe(true)
    expect(hasDurationField('weighted_duration')).toBe(true)
    expect(hasDurationField('distance_duration')).toBe(true)
    expect(hasDurationField('reps')).toBe(false)
  })
})

describe('formatExerciseDefaults', () => {
  it('menggabungkan set x rep dan beban', () => {
    const exercise = makeExercise({ defaultSets: 5, defaultReps: 5, defaultWeightKg: 60 })
    expect(formatExerciseDefaults(exercise)).toBe('5×5 · 60 kg')
  })

  it('menggabungkan set x durasi tanpa beban', () => {
    const exercise = makeExercise({
      measurement: 'duration',
      defaultSets: 3,
      defaultDurationSec: 45,
      defaultReps: undefined,
      defaultWeightKg: undefined,
    })
    expect(formatExerciseDefaults(exercise)).toBe('3×45 dtk')
  })

  it('mengembalikan null kalau tidak ada nilai default sama sekali', () => {
    const exercise = makeExercise({
      defaultSets: undefined,
      defaultReps: undefined,
      defaultWeightKg: undefined,
      defaultDurationSec: undefined,
    })
    expect(formatExerciseDefaults(exercise)).toBeNull()
  })
})

describe('formatWorkoutEntrySummary', () => {
  it('menyembunyikan field yang tidak relevan dengan measurement gerakan', () => {
    const exercise = makeExercise({ measurement: 'reps' })
    const summary = formatWorkoutEntrySummary(
      { sets: 3, reps: 15, weightKg: 20, durationSec: 30 },
      exercise,
    )
    // weightKg & durationSec diisi tapi tidak relevan untuk measurement 'reps'.
    expect(summary).toBe('3 set · 15 rep')
  })

  it('mengembalikan string kosong kalau exercise tidak ditemukan', () => {
    expect(
      formatWorkoutEntrySummary({ sets: 3, reps: 5, weightKg: 0, durationSec: 0 }, undefined),
    ).toBe('')
  })

  it('melewati field bernilai 0 walau relevan dengan measurement-nya', () => {
    const exercise = makeExercise({ measurement: 'weight_reps' })
    const summary = formatWorkoutEntrySummary(
      { sets: 5, reps: 5, weightKg: 0, durationSec: 0 },
      exercise,
    )
    expect(summary).toBe('5 set · 5 rep')
  })
})

describe('label', () => {
  it('mengubah snake_case jadi Title Case', () => {
    expect(label('full_body')).toBe('Full Body')
    expect(label('quads')).toBe('Quads')
  })
})
