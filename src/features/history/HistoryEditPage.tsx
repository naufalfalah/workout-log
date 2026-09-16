import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import PageContainer from '@/app/PageContainer'
import type { Exercise } from '@/domain/types'
import type { WorkoutResultEntry } from '@/db/schema'
import { hasDurationField, hasWeightField, label } from '@/components/exerciseLabels'
import CheckIcon from '@/components/CheckIcon'
import ExercisePicker from '@/components/ExercisePicker'
import NumberStepper from '@/components/NumberStepper'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import { useExercises } from '../exercises/exercises.store'
import { updateDailyWorkoutResultEntries, useDailyWorkoutResult } from '../session/dailyWorkoutResults.store'

function weightStep(exercise: Exercise): number {
  return exercise.equipment === 'dumbbell' ? 1 : 2.5
}

// Entri dianggap belum diisi kalau semua nilainya masih 0 — sama seperti
// aturan di /session/active (lihat ActiveSessionPage.tsx).
function isEntryEmpty(entry: WorkoutResultEntry): boolean {
  return entry.sets === 0 && entry.reps === 0 && entry.weight.value === 0 && entry.durationSec === 0
}

function buildEntry(exerciseId: string, exercise: Exercise | undefined): WorkoutResultEntry {
  return {
    exerciseId,
    sets: exercise?.defaultSets ?? 0,
    reps: exercise?.defaultReps ?? 0,
    weight: exercise?.defaultWeight ?? { value: 0, unit: 'kg' },
    durationSec: exercise?.defaultDurationSec ?? 0,
    completed: false,
  }
}

export default function HistoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const exercises = useExercises()
  const session = useDailyWorkoutResult(id ?? '')

  const [entries, setEntries] = useState<WorkoutResultEntry[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Sama seperti ActiveSessionPage: isi entri awal sekali saja dari sesi
  // tersimpan, disesuaikan saat render (bukan di efek) dengan guard
  // `initialized` supaya jalan sekali walau useDailyWorkoutResult ikut
  // berubah tiap kali handleSave menulis ke tabel yang sama.
  if (!initialized && session !== 'loading') {
    setInitialized(true)
    if (session) setEntries(session.entries)
  }

  function updateEntry(exerciseId: string, patch: Partial<WorkoutResultEntry>) {
    setEntries((prev) =>
      prev.map((entry) => (entry.exerciseId === exerciseId ? { ...entry, ...patch } : entry)),
    )
  }

  function toggleCompleted(exerciseId: string) {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.exerciseId === exerciseId ? { ...entry, completed: !entry.completed } : entry,
      ),
    )
  }

  function removeExercise(exerciseId: string) {
    setEntries((prev) => prev.filter((entry) => entry.exerciseId !== exerciseId))
  }

  function addExercise(exerciseId: string) {
    setEntries((prev) => {
      if (prev.some((entry) => entry.exerciseId === exerciseId)) return prev
      return [...prev, buildEntry(exerciseId, exercises.find((ex) => ex.id === exerciseId))]
    })
  }

  async function handleSave() {
    if (!id) return
    if (entries.length === 0 || entries.some(isEntryEmpty)) {
      setShowValidation(true)
      return
    }

    await updateDailyWorkoutResultEntries(id, entries)
    navigate('/history')
  }

  if (!id) return null

  if (session === 'loading' || !initialized) {
    return (
      <PageContainer variant="form">
        <p className="text-zinc-500">Memuat...</p>
      </PageContainer>
    )
  }

  if (!session) {
    return (
      <PageContainer variant="form">
        <p>Sesi ini tidak ditemukan. Mungkin sudah dihapus.</p>
        <Link to="/history" className="text-primary-400">
          Kembali ke riwayat
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/history" className="text-sm text-zinc-400">
          &larr; Riwayat
        </Link>
        <h1 className="text-2xl font-semibold">Edit Sesi Latihan</h1>
        <p className="text-sm text-zinc-400">
          {format(new Date(session.date), 'EEEE, d MMMM yyyy', { locale: localeId })}{' '}
          <span className="text-zinc-500">
            · dicatat {format(new Date(session.createdAt), 'HH:mm')}
          </span>
        </p>
      </header>

      <div className="flex flex-col gap-3">
        {entries.map((entry) => {
          const exercise = exercises.find((ex) => ex.id === entry.exerciseId)
          if (!exercise) return null
          const showWeight = hasWeightField(exercise.measurement)
          const showDuration = hasDurationField(exercise.measurement)
          const columns = 2 + (showWeight ? 1 : 0) + (showDuration ? 1 : 0)
          const columnsClass =
            columns === 4 ? 'grid-cols-4' : columns === 3 ? 'grid-cols-3' : 'grid-cols-2'
          const isInvalid = showValidation && isEntryEmpty(entry)
          const isCompleted = entry.completed === true

          return (
            <div
              key={entry.exerciseId}
              className={`overflow-hidden rounded-xl bg-zinc-900 ${
                isInvalid ? 'ring-1 ring-red-500' : isCompleted ? 'ring-1 ring-primary-500' : ''
              }`}
            >
              <div className="flex items-center gap-3 border-b border-zinc-800 p-3">
                {exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                    <PhotoPlaceholderIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{exercise.name}</p>
                  <p className="text-sm text-zinc-400">{label(exercise.equipment)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleCompleted(entry.exerciseId)}
                  aria-pressed={isCompleted}
                  aria-label={
                    isCompleted
                      ? `Tandai ${exercise.name} belum selesai`
                      : `Tandai ${exercise.name} selesai`
                  }
                  className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-3 text-sm font-medium transition-colors ${
                    isCompleted
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-zinc-700 bg-transparent text-zinc-500 active:bg-zinc-800'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                      isCompleted ? 'border-white bg-white/10' : 'border-zinc-600'
                    }`}
                  >
                    {isCompleted && <CheckIcon className="h-4 w-4 text-white" />}
                  </span>
                  Selesai
                </button>
                <button
                  type="button"
                  onClick={() => removeExercise(entry.exerciseId)}
                  aria-label={`Hapus ${exercise.name} dari sesi`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-400 active:bg-zinc-700"
                >
                  &times;
                </button>
              </div>

              <div className="flex flex-col gap-3 p-3">
                <div className={`grid gap-1 ${columnsClass}`}>
                  <NumberStepper
                    label="Set"
                    value={entry.sets}
                    step={1}
                    onChange={(sets) => updateEntry(entry.exerciseId, { sets })}
                  />
                  <NumberStepper
                    label="Rep"
                    value={entry.reps}
                    step={1}
                    onChange={(reps) => updateEntry(entry.exerciseId, { reps })}
                  />
                  {showWeight && (
                    <NumberStepper
                      label={`Beban (${entry.weight.unit})`}
                      value={entry.weight.value}
                      step={weightStep(exercise)}
                      onChange={(value) =>
                        updateEntry(entry.exerciseId, { weight: { ...entry.weight, value } })
                      }
                    />
                  )}
                  {showDuration && (
                    <NumberStepper
                      label="Durasi (dtk)"
                      value={entry.durationSec}
                      step={5}
                      onChange={(durationSec) => updateEntry(entry.exerciseId, { durationSec })}
                    />
                  )}
                </div>
                {isInvalid && (
                  <p className="text-xs text-red-400">
                    Isi minimal salah satu nilai (set, rep, beban, atau durasi).
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <AddExercisePicker
        exercises={exercises}
        excludeIds={entries.map((entry) => entry.exerciseId)}
        onAdd={addExercise}
      />

      {showValidation && (entries.length === 0 || entries.some(isEntryEmpty)) && (
        <p className="text-sm text-red-400">
          {entries.length === 0
            ? 'Sesi tidak boleh kosong. Tambah minimal satu gerakan.'
            : 'Ada gerakan yang belum dicatat. Isi minimal satu nilai, atau hapus gerakan itu.'}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        className="h-14 rounded-2xl bg-primary-500 text-lg font-semibold text-white active:bg-primary-600"
      >
        Simpan perubahan
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
