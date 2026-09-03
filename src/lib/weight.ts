import type { Exercise, Weight, WeightUnit } from '@/domain/types'

const KG_PER_LB = 0.45359237

export function weightStepKg(exercise: Exercise): number {
  return exercise.equipment === 'dumbbell' ? 1 : 2.5
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB
}

export function roundWeight(value: number): number {
  return Math.round(value * 100) / 100
}

export function weightStepForUnit(unit: WeightUnit): number {
  return unit === 'kg' ? 1 : 11
}

export function convertWeight(weight: Weight, toUnit: WeightUnit): Weight {
  if (weight.unit === toUnit) return weight
  const value = toUnit === 'lb' ? kgToLb(weight.value) : lbToKg(weight.value)
  return { value: roundWeight(value), unit: toUnit }
}
