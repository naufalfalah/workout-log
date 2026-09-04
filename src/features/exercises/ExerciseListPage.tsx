import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import ConfirmDialog from '@/app/ConfirmDialog'
import PageContainer from '@/app/PageContainer'
import type { Equipment, MuscleGroup } from '@/domain/types'
import {
  equipmentOptions,
  formatExerciseDefaults,
  label,
  muscleOptions,
} from '@/components/exerciseLabels'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import SwipeToDelete from '@/components/SwipeToDelete'
import { archiveExercise, useExercises } from './exercises.store'

type SourceFilter = 'all' | 'builtin' | 'custom'

export default function ExerciseListPage() {
  const exercises = useExercises()

  const [query, setQuery] = useState('')
  const [equipment, setEquipment] = useState<Equipment | 'all'>('all')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const [source, setSource] = useState<SourceFilter>('all')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return exercises
      .filter((exercise) => !exercise.isArchived)
      .filter((ex) => (q === '' ? true : ex.name.toLowerCase().includes(q)))
      .filter((ex) => (equipment === 'all' ? true : ex.equipment === equipment))
      .filter((ex) => (muscle === 'all' ? true : ex.primaryMuscles.includes(muscle)))
      .filter((ex) => {
        if (source === 'all') return true
        return source === 'custom' ? ex.isCustom : !ex.isCustom
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [exercises, query, equipment, muscle, source])

  const hasActiveFilters =
    query.trim() !== '' || equipment !== 'all' || muscle !== 'all' || source !== 'all'

  const resetFilters = () => {
    setQuery('')
    setEquipment('all')
    setMuscle('all')
    setSource('all')
  }

  const exerciseToDelete = exercises.find((ex) => ex.id === deleteTarget)

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    await archiveExercise(id)
  }

  return (
    <PageContainer>
      <div className="sticky top-0 z-10 flex flex-col gap-4 bg-zinc-950 pb-3">
        <header className="flex items-center justify-between pt-2">
          <h1 className="text-2xl font-semibold">Pustaka Gerakan</h1>
          <Link
            to="/exercises/new"
            className="flex h-11 items-center rounded-xl bg-primary-500 px-4 font-medium text-white active:bg-primary-600"
          >
            + Tambah
          </Link>
        </header>

        <div>
          <label htmlFor="exercise-search" className="mb-1 block text-xs text-zinc-500">
            Cari
          </label>
          <input
            id="exercise-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari gerakan..."
            className="h-12 w-full rounded-xl bg-zinc-900 px-4 text-base outline-none focus:ring-2 focus:ring-primary-500 md:max-w-md"
          />
        </div>

        <div>
          <p className="mb-1 text-xs text-zinc-500">Sumber</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(['all', 'builtin', 'custom'] as SourceFilter[]).map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setSource(opt)}
                className={`h-9 shrink-0 rounded-full px-4 text-sm ${
                  source === opt ? 'bg-primary-500 text-white' : 'bg-zinc-900 text-zinc-400'
                }`}
              >
                {opt === 'all' ? 'Semua' : opt === 'builtin' ? 'Bawaan' : 'Buatan sendiri'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 sm:max-w-md">
          <div className="flex-1">
            <label htmlFor="exercise-equipment" className="mb-1 block text-xs text-zinc-500">
              Alat
            </label>
            <select
              id="exercise-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as Equipment | 'all')}
              className="h-11 w-full rounded-lg bg-zinc-900 px-3 text-sm outline-none"
            >
              <option value="all">Semua alat</option>
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>
                  {label(eq)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="exercise-muscle" className="mb-1 block text-xs text-zinc-500">
              Otot
            </label>
            <select
              id="exercise-muscle"
              value={muscle}
              onChange={(e) => setMuscle(e.target.value as MuscleGroup | 'all')}
              className="h-11 w-full rounded-lg bg-zinc-900 px-3 text-sm outline-none"
            >
              <option value="all">Semua otot</option>
              {muscleOptions.map((m) => (
                <option key={m} value={m}>
                  {label(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-start text-sm text-primary-400 active:text-primary-300"
          >
            Reset filter
          </button>
        )}
      </div>

      <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-3">
        {filtered.map((ex) => (
          <li key={ex.id}>
            <SwipeToDelete onDelete={() => setDeleteTarget(ex.id)}>
              <Link
                to={`/exercises/${ex.id}`}
                className="flex items-center justify-between gap-3 bg-zinc-900 px-4 py-3 active:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  {ex.imageUrl ? (
                    <img
                      src={ex.imageUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                      <PhotoPlaceholderIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{ex.name}</p>
                    <p className="text-sm text-zinc-400">
                      {label(ex.equipment)} · {ex.primaryMuscles.map(label).join(', ')}
                    </p>
                    {formatExerciseDefaults(ex) && (
                      <p className="text-xs text-primary-400">{formatExerciseDefaults(ex)}</p>
                    )}
                  </div>
                </div>
                {ex.isCustom && (
                  <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                    Custom
                  </span>
                )}
              </Link>
            </SwipeToDelete>
          </li>
        ))}
      </ul>
      {filtered.length === 0 && (
        <p className="mt-8 text-center text-zinc-500">Tidak ada gerakan yang cocok.</p>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus gerakan ini?"
        message={`Gerakan "${exerciseToDelete?.name ?? ''}" akan disembunyikan dari pustaka. Routine dan riwayat yang masih memakainya tidak akan terpengaruh.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  )
}
