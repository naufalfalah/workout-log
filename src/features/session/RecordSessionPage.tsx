import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import PageContainer from '@/app/PageContainer'
import type { Exercise, SimpleRoutineItem } from '@/domain/types'
import type { WorkoutResultEntry } from '@/db/schema'
import { label } from '@/components/exerciseLabels'
import ExercisePicker from '@/components/ExercisePicker'
import { useExercises } from '../exercises/exercises.store'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import { useRoutines } from '../routines/routines.store'
import { saveDailyExerciseLog, useDailyExerciseLog } from './dailyExerciseLogs.store'

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// Entri awal untuk satu gerakan: pakai target dari item routine (kalau
// dipilih dari routine) dulu, baru nilai default gerakan itu sendiri.
function buildEntry(
  exerciseId: string,
  exercise: Exercise | undefined,
  routineItem?: SimpleRoutineItem,
): WorkoutResultEntry {
  return {
    exerciseId,
    sets: routineItem?.targetSets ?? exercise?.defaultSets ?? 0,
    reps: routineItem?.targetReps ?? exercise?.defaultReps ?? 0,
    weight: routineItem?.targetWeight ?? exercise?.defaultWeight ?? { value: 0, unit: 'kg' },
    durationSec: routineItem?.targetDurationSec ?? exercise?.defaultDurationSec ?? 0,
  }
}

export default function RecordSessionPage() {
  const navigate = useNavigate()
  const dateKey = todayKey()

  const routines = useRoutines()
  const exercises = useExercises()
  const existingLog = useDailyExerciseLog(dateKey)

  const [entries, setEntries] = useState<WorkoutResultEntry[]>([])
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)

  if (!initialized && existingLog !== 'loading') {
    setInitialized(true)
    if (existingLog) setEntries(existingLog.entries)
  }

  function pickRoutine(routineId: string) {
    const routine = routines.find((r) => r.id === routineId)
    if (!routine) return
    setSelectedRoutineId(routineId)
    setEntries(
      routine.items.map((item) =>
        buildEntry(
          item.exerciseId,
          exercises.find((ex) => ex.id === item.exerciseId),
          item,
        ),
      ),
    )
  }

  function removeExercise(exerciseId: string) {
    setEntries((prev) => prev.filter((entry) => entry.exerciseId !== exerciseId))
  }

  function addExercise(exerciseId: string) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.exerciseId === exerciseId)) return prev
      return [
        ...prev,
        buildEntry(
          exerciseId,
          exercises.find((ex) => ex.id === exerciseId),
        ),
      ]
    })
  }

  async function handleSave() {
    await saveDailyExerciseLog(dateKey, entries)
    navigate('/session/active')
  }

  const selectedExercises = entries
    .map((entry) => exercises.find((ex) => ex.id === entry.exerciseId))
    .filter((ex): ex is Exercise => Boolean(ex))

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/" className="text-sm text-zinc-400 md:hidden">
          &larr; Beranda
        </Link>
        <h1 className="text-2xl font-semibold">Sesi Latihan</h1>
        <p className="text-sm text-zinc-400">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })}
        </p>
      </header>

      <section>
        <p className="mb-2 text-sm text-zinc-400">Pilih routine</p>
        {routines.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Belum ada routine.{' '}
            <Link to="/routines/new" className="text-primary-400">
              Buat routine
            </Link>
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {routines.map((routine) => (
              <button
                key={routine.id}
                type="button"
                onClick={() => pickRoutine(routine.id)}
                className={`h-11 shrink-0 rounded-xl px-4 text-sm font-medium ${
                  selectedRoutineId === routine.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-zinc-900 text-zinc-300'
                }`}
              >
                {routine.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm text-zinc-400">Gerakan hari ini</p>
        {selectedExercises.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Belum ada gerakan dipilih. Pilih routine di atas, atau tambah manual di bawah.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedExercises.map((ex) => (
              <li key={ex.id} className="flex items-center gap-3 rounded-xl bg-zinc-900 px-4 py-3">
                {ex.imageUrl ? (
                  <img
                    src={ex.imageUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                    <PhotoPlaceholderIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{ex.name}</p>
                  <p className="text-sm text-zinc-400">{label(ex.equipment)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(ex.id)}
                  aria-label={`Hapus ${ex.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400"
                >
                  &times;
                </button>
              </li>
            ))}
          </ul>
        )}

        <hr className="my-2 border-zinc-800" />
        <AddExercisePicker
          exercises={exercises}
          excludeIds={entries.map((entry) => entry.exerciseId)}
          onAdd={addExercise}
        />
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={entries.length === 0}
        className="h-14 rounded-2xl bg-primary-500 text-lg font-semibold text-white active:bg-primary-600 disabled:opacity-50"
      >
        Mulai latihan
      </button>
    </PageContainer>
  )
}

function AddExercisePicker({
  exercises,
  excludeIds,
  onAdd,
}: {
  exercises: Exercise[]
  excludeIds: string[]
  onAdd: (exerciseId: string) => void
}) {
  const options = exercises.filter((ex) => !excludeIds.includes(ex.id))
  const [value, setValue] = useState('')

  if (options.length > 0 && !options.some((ex) => ex.id === value)) {
    setValue(options[0].id)
  }

  if (options.length === 0) return null

  return (
    <div className="flex gap-2">
      <ExercisePicker exercises={options} value={value} onChange={setValue} className="flex-1" />
      <button
        type="button"
        onClick={() => value && onAdd(value)}
        className="h-11 rounded-lg bg-zinc-900 px-4 text-sm text-zinc-300"
      >
        + Tambah
      </button>
    </div>
  )
}
