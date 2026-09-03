import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ulid } from 'ulid'

import PageContainer from '@/app/PageContainer'
import type { Exercise, Weight } from '@/domain/types'
import { hasDurationField, hasWeightField } from '@/components/exerciseLabels'
import ExercisePicker from '@/components/ExercisePicker'
import NumberStepper from '@/components/NumberStepper'
import { useExercises } from '../exercises/exercises.store'
import { addRoutine, getRoutine, removeRoutine, updateRoutine } from './routines.store'
import { weightStepForUnit } from '@/lib/weight'

interface ItemDraft {
  id: string
  exerciseId: string
  targetSets?: number
  targetReps?: number
  targetWeight?: Weight
  targetDurationSec?: number
}

function defaultsForExercise(exercise?: Exercise) {
  return {
    targetSets: exercise?.defaultSets ?? 0,
    targetReps: exercise?.defaultReps ?? 0,
    targetWeight: exercise?.defaultWeight,
    targetDurationSec: exercise?.defaultDurationSec ?? 0,
  }
}

function emptyItem(exercise?: Exercise): ItemDraft {
  return {
    id: ulid(),
    exerciseId: exercise?.id ?? '',
    ...defaultsForExercise(exercise),
  }
}

type LoadState = 'loading' | 'ready' | 'not-found'

export default function RoutineFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const exercises = useExercises().filter((exercise) => !exercise.isArchived)

  const [loadState, setLoadState] = useState<LoadState>(isEditing ? 'loading' : 'ready')
  const [routineName, setRoutineName] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  // Muat data routine sekali saat mode edit — bukan live query, supaya
  // tidak menimpa perubahan yang sedang diketik pengguna.
  useEffect(() => {
    if (!isEditing || !id) return
    let cancelled = false
    getRoutine(id).then((routine) => {
      if (cancelled) return
      if (!routine) {
        setLoadState('not-found')
        return
      }
      setRoutineName(routine.name)
      setTagsInput(routine.tags.join(', '))
      setItems(routine.items ?? [])
      setLoadState('ready')
    })
    return () => {
      cancelled = true
    }
  }, [id, isEditing])

  useEffect(() => {
    if (isEditing) return
    if (exercises.length === 0) return
    setItems((prev) => (prev.length > 0 ? prev : [emptyItem(exercises[0])]))
  }, [isEditing, exercises])

  if (loadState === 'not-found') {
    return (
      <PageContainer variant="form">
        <p>Routine tidak ditemukan.</p>
        <Link to="/routines" className="text-primary-400">
          Kembali ke daftar routine
        </Link>
      </PageContainer>
    )
  }

  if (loadState === 'loading') {
    return (
      <PageContainer variant="form">
        <p className="text-zinc-500">Memuat...</p>
      </PageContainer>
    )
  }

  function updateItem(id: string, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (routineName.trim() === '') {
      setError('Nama routine wajib diisi.')
      return
    }
    if (items.length === 0) {
      setError('Tambahkan minimal satu gerakan.')
      return
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (isEditing && id) {
      await updateRoutine(id, { name: routineName.trim(), tags, items })
    } else {
      await addRoutine({ name: routineName.trim(), tags, items })
    }
    navigate('/routines')
  }

  async function handleDelete() {
    if (!id) return
    if (window.confirm(`Hapus routine "${routineName}"?`)) {
      await removeRoutine(id)
      navigate('/routines')
    }
  }

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/routines" className="text-sm text-zinc-400 md:hidden">
          &larr; Routine
        </Link>
        <h1 className="text-2xl font-semibold">{isEditing ? 'Edit Routine' : 'Routine Baru'}</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-zinc-400">
            Nama routine
          </label>
          <input
            id="name"
            value={routineName}
            onChange={(e) => setRoutineName(e.target.value)}
            placeholder="mis. Push Day A"
            className="h-12 rounded-xl bg-zinc-900 px-4 text-base outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="tags" className="text-sm text-zinc-400">
            Tag (pisahkan dengan koma)
          </label>
          <input
            id="tags"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="push, upper"
            className="h-12 rounded-xl bg-zinc-900 px-4 text-base outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-zinc-400">Gerakan</p>
          {items.map((item) => {
            const selectedExercise = exercises.find((ex) => ex.id === item.exerciseId)
            return (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-3">
                <div className="flex items-center gap-2">
                  <ExercisePicker
                    exercises={exercises}
                    value={item.exerciseId}
                    onChange={(exerciseId) => {
                      const nextExercise = exercises.find((ex) => ex.id === exerciseId)
                      updateItem(item.id, {
                        exerciseId,
                        ...defaultsForExercise(nextExercise),
                      })
                    }}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Hapus gerakan"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 active:bg-zinc-700"
                  >
                    &times;
                  </button>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-2 border-t border-zinc-800 pt-3">
                  <NumberStepper
                    label="Set"
                    value={item.targetSets ?? 0}
                    step={1}
                    onChange={(targetSets) => updateItem(item.id, { targetSets })}
                  />
                  <NumberStepper
                    label="Rep"
                    value={item.targetReps ?? 0}
                    step={1}
                    onChange={(targetReps) => updateItem(item.id, { targetReps })}
                  />
                  {selectedExercise &&
                    hasWeightField(selectedExercise.measurement) &&
                    (() => {
                      const unit =
                        item.targetWeight?.unit ?? selectedExercise.defaultWeight?.unit ?? 'kg'
                      return (
                        <NumberStepper
                          label={`Beban (${unit})`}
                          value={item.targetWeight?.value ?? 0}
                          step={weightStepForUnit(unit)}
                          onChange={(value) =>
                            updateItem(item.id, { targetWeight: { value, unit } })
                          }
                        />
                      )
                    })()}
                  {selectedExercise && hasDurationField(selectedExercise.measurement) && (
                    <NumberStepper
                      label="Durasi (dtk)"
                      value={item.targetDurationSec ?? 0}
                      step={5}
                      onChange={(targetDurationSec) => updateItem(item.id, { targetDurationSec })}
                    />
                  )}
                </div>
              </div>
            )
          })}
          <button
            type="button"
            disabled={exercises.length === 0}
            onClick={() =>
              exercises.length > 0 && setItems((prev) => [...prev, emptyItem(exercises[0])])
            }
            className="h-11 rounded-xl border border-dashed border-zinc-700 text-sm text-zinc-400 active:bg-zinc-900 disabled:opacity-50"
          >
            + Tambah gerakan
          </button>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          className="h-14 rounded-2xl bg-primary-500 text-lg font-semibold text-white active:bg-primary-600"
        >
          Simpan
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl text-sm text-red-400 active:bg-zinc-900"
          >
            Hapus routine
          </button>
        )}
      </form>
    </PageContainer>
  )
}
