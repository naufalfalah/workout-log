import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import ConfirmDialog from '@/app/ConfirmDialog'
import PageContainer from '@/app/PageContainer'
import type { Exercise } from '@/domain/types'
import type { WorkoutResultEntry } from '@/db/schema'
import { hasDurationField, hasWeightField, label } from '@/components/exerciseLabels'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import { useExercises } from '../exercises/exercises.store'
import { saveDailyExerciseLog, useDailyExerciseLog } from './dailyExerciseLogs.store'
import { saveDailyWorkoutResult, useDailyWorkoutResult } from './dailyWorkoutResults.store'

function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

function roundStep(value: number): number {
  return Math.round(value * 10) / 10
}

function weightStep(exercise: Exercise): number {
  return exercise.equipment === 'dumbbell' ? 1 : 2.5
}

function defaultEntry(exerciseId: string): WorkoutResultEntry {
  return { exerciseId, sets: 0, reps: 0, weightKg: 0, durationSec: 0 }
}

// Entri dianggap belum diisi kalau semua nilainya masih 0 — berarti
// pengguna belum benar-benar mencatat apa pun untuk gerakan ini.
function isEntryEmpty(entry: WorkoutResultEntry): boolean {
  return entry.sets === 0 && entry.reps === 0 && entry.weightKg === 0 && entry.durationSec === 0
}

export default function ActiveSessionPage() {
  const navigate = useNavigate()
  const dateKey = todayKey()

  const exercises = useExercises()
  const plannedLog = useDailyExerciseLog(dateKey)
  const existingResult = useDailyWorkoutResult(dateKey)

  const [entries, setEntries] = useState<WorkoutResultEntry[]>([])
  // Baru menampilkan tanda merah pada kartu yang kosong setelah pengguna
  // benar-benar mencoba menyimpan — supaya tidak langsung penuh warna
  // merah saat halaman pertama kali dibuka.
  const [showValidation, setShowValidation] = useState(false)
  // State (bukan ref) supaya perubahan selalu memicu render ulang, termasuk
  // saat tidak ada entries yang perlu di-set (plannedLog & existingResult
  // sama-sama kosong) — ref saja tidak akan memicu re-render di kasus itu.
  const [initialized, setInitialized] = useState(false)
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false)

  // Isi entri awal sekali saja: pakai hasil yang sudah tersimpan hari ini
  // kalau ada, kalau belum ada mulai dari rencana gerakan (dailyExerciseLogs).
  // Tunggu KEDUA query selesai supaya tidak salah anggap "belum ada hasil"
  // hanya karena query hasil belum resolve duluan.
  useEffect(() => {
    if (initialized) return
    if (plannedLog === 'loading' || existingResult === 'loading') return
    if (existingResult) {
      setEntries(existingResult.entries)
    } else if (plannedLog) {
      setEntries(plannedLog.exerciseIds.map(defaultEntry))
    }
    setInitialized(true)
  }, [plannedLog, existingResult, initialized])

  function updateEntry(exerciseId: string, patch: Partial<WorkoutResultEntry>) {
    setEntries((prev) =>
      prev.map((entry) => (entry.exerciseId === exerciseId ? { ...entry, ...patch } : entry)),
    )
  }

  async function handleSave() {
    const hasInvalidEntry = entries.some(isEntryEmpty)
    if (hasInvalidEntry) {
      setShowValidation(true)
      return
    }

    // Simpan hasil (set/rep/beban/durasi) tiap gerakan untuk tanggal hari
    // ini, lalu hapus rencana aktif (dailyExerciseLogs) supaya lain kali
    // pengguna membuka /session/active dianggap belum ada sesi berjalan
    // dan bisa mulai sesi baru dari nol.
    await saveDailyWorkoutResult(dateKey, entries)
    await saveDailyExerciseLog(dateKey, [])
    navigate('/')
  }

  async function confirmCancel() {
    setConfirmCancelOpen(false)
    await saveDailyWorkoutResult(dateKey, [])
    await saveDailyExerciseLog(dateKey, [])
    navigate('/')
  }

  if (plannedLog === 'loading' || !initialized) {
    return (
      <PageContainer variant="form">
        <p className="text-zinc-500">Memuat...</p>
      </PageContainer>
    )
  }

  if (!plannedLog || plannedLog.exerciseIds.length === 0) {
    return (
      <PageContainer variant="form">
        <p>Belum ada gerakan yang direncanakan untuk hari ini.</p>
        <Link to="/session" className="text-primary-400">
          Pilih gerakan dulu
        </Link>
      </PageContainer>
    )
  }

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/" className="text-sm text-zinc-400 md:hidden">
          &larr; Beranda
        </Link>
        <h1 className="text-2xl font-semibold">Latihan Berjalan</h1>
        <p className="text-sm text-zinc-400">
          {format(new Date(), 'EEEE, d MMMM yyyy', { locale: localeId })}
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

          return (
            <div
              key={entry.exerciseId}
              className={`flex flex-col gap-3 rounded-xl bg-zinc-900 p-3 ${
                isInvalid ? 'ring-1 ring-red-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-sm text-zinc-400">{label(exercise.equipment)}</p>
                </div>
              </div>

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
                    label="Beban (kg)"
                    value={entry.weightKg}
                    step={weightStep(exercise)}
                    onChange={(weightKg) => updateEntry(entry.exerciseId, { weightKg })}
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
          )
        })}
      </div>

      {showValidation && entries.some(isEntryEmpty) && (
        <p className="text-sm text-red-400">
          Ada gerakan yang belum dicatat. Isi minimal satu nilai sebelum menyimpan.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="h-14 rounded-2xl bg-primary-500 text-lg font-semibold text-white active:bg-primary-600"
        >
          Simpan hasil latihan
        </button>
        <button
          type="button"
          onClick={() => setConfirmCancelOpen(true)}
          className="h-12 rounded-2xl bg-transparent text-base font-medium text-red-400 active:bg-zinc-900"
        >
          Batalkan latihan
        </button>
      </div>

      <ConfirmDialog
        open={confirmCancelOpen}
        title="Batalkan latihan?"
        message="Hasil yang sudah dicatat untuk hari ini akan dihapus."
        confirmLabel="Batalkan"
        cancelLabel="Tidak"
        danger
        onConfirm={confirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </PageContainer>
  )
}

function NumberStepper({
  label: fieldLabel,
  value,
  step,
  min = 0,
  onChange,
}: {
  label: string
  value: number
  step: number
  min?: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="truncate text-xs text-zinc-500">{fieldLabel}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Kurangi ${fieldLabel}`}
          onClick={() => onChange(Math.max(min, roundStep(value - step)))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base text-zinc-300 active:bg-zinc-700"
        >
          &minus;
        </button>
        <span className="w-7 shrink-0 text-center text-sm font-medium tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Tambah ${fieldLabel}`}
          onClick={() => onChange(roundStep(value + step))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base text-zinc-300 active:bg-zinc-700"
        >
          +
        </button>
      </div>
    </div>
  )
}
