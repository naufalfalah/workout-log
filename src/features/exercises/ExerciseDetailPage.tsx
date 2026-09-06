import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import PageContainer from '@/app/PageContainer'
import type { Exercise, WeightUnit } from '@/domain/types'
import { readImageAsDataUrl } from '@/lib/imageFile'
import ImageLightbox from '@/components/ImageLightbox'
import {
  hasDurationField,
  hasRepsField,
  hasWeightField,
  label,
  measurementLabels,
} from '@/components/exerciseLabels'
import NumberStepper from '@/components/NumberStepper'
import { useRoutines } from '../routines/routines.store'
import { setExerciseImage, updateExerciseDefaults, useExercise } from './exercises.store'

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const exercise = useExercise(id)
  const routines = useRoutines()
  const [imageError, setImageError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    try {
      const dataUrl = await readImageAsDataUrl(file)
      await setExerciseImage(id, dataUrl)
      setImageError(null)
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Gagal memuat gambar.')
    } finally {
      e.target.value = ''
    }
  }

  if (!exercise) {
    return (
      <PageContainer variant="form">
        <p>Gerakan tidak ditemukan.</p>
        <Link to="/exercises" className="text-primary-400">
          Kembali ke pustaka gerakan
        </Link>
      </PageContainer>
    )
  }

  const usedInRoutines = routines.filter((routine) =>
    (routine.items ?? []).some((item) => item.exerciseId === exercise.id),
  )

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/exercises" className="text-sm text-zinc-400 md:hidden">
          &larr; Pustaka Gerakan
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{exercise.name}</h1>
          {exercise.isCustom && (
            <span className="rounded-full bg-zinc-800 px-2 py-1 text-xs text-zinc-400">Custom</span>
          )}
        </div>
      </header>

      <div>
        {exercise.imageUrl ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="block w-full"
            aria-label={`Lihat gambar ${exercise.name} lebih besar`}
          >
            <img
              src={exercise.imageUrl}
              alt={exercise.name}
              className="aspect-video w-full rounded-xl object-cover"
            />
          </button>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl bg-zinc-900 text-sm text-zinc-500">
            Belum ada gambar
          </div>
        )}
        <div className="mt-2 flex gap-2">
          <label className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-lg bg-zinc-900 text-sm text-zinc-300">
            {exercise.imageUrl ? 'Ganti gambar' : 'Tambah gambar'}
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
          {exercise.imageUrl && (
            <button
              type="button"
              onClick={() => id && setExerciseImage(id, undefined)}
              className="h-10 rounded-lg bg-zinc-900 px-4 text-sm text-red-400"
            >
              Hapus gambar
            </button>
          )}
        </div>
        {imageError && <p className="mt-1 text-sm text-red-400">{imageError}</p>}
      </div>

      <dl className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-4">
        <div>
          <dt className="text-sm text-zinc-400">Alat</dt>
          <dd>{label(exercise.equipment)}</dd>
        </div>
        <div>
          <dt className="text-sm text-zinc-400">Otot utama</dt>
          <dd>{exercise.primaryMuscles.map(label).join(', ')}</dd>
        </div>
        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
          <div>
            <dt className="text-sm text-zinc-400">Otot sekunder</dt>
            <dd>{exercise.secondaryMuscles.map(label).join(', ')}</dd>
          </div>
        )}
        <div>
          <dt className="text-sm text-zinc-400">Cara diukur</dt>
          <dd>{measurementLabels[exercise.measurement]}</dd>
        </div>
        <DefaultsEditor key={exercise.id} exercise={exercise} />
        {exercise.defaultRestSec !== undefined && (
          <div>
            <dt className="text-sm text-zinc-400">Istirahat default</dt>
            <dd>{exercise.defaultRestSec} detik</dd>
          </div>
        )}
        {exercise.aliases && exercise.aliases.length > 0 && (
          <div>
            <dt className="text-sm text-zinc-400">Alias</dt>
            <dd>{exercise.aliases.join(', ')}</dd>
          </div>
        )}
        {exercise.notes && (
          <div>
            <dt className="text-sm text-zinc-400">Catatan</dt>
            <dd>{exercise.notes}</dd>
          </div>
        )}
      </dl>

      <section>
        <h2 className="mb-2 text-sm font-medium text-zinc-400">Dipakai di routine</h2>
        {usedInRoutines.length === 0 ? (
          <p className="text-sm text-zinc-500">Belum dipakai di routine manapun.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {usedInRoutines.map((routine) => (
              <li key={routine.id}>
                <Link
                  to={`/routines/${routine.id}/edit`}
                  className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3 active:bg-zinc-800"
                >
                  <span className="font-medium">{routine.name}</span>
                  <span className="text-sm text-zinc-500">
                    {routine.tags.join(' · ') || 'Tanpa tag'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lightboxOpen && exercise.imageUrl && (
        <ImageLightbox
          src={exercise.imageUrl}
          alt={exercise.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </PageContainer>
  )
}

function DefaultsEditor({ exercise }: { exercise: Exercise }) {
  const [sets, setSets] = useState(exercise.defaultSets ?? 0)
  const [reps, setReps] = useState(exercise.defaultReps ?? 0)
  const [weightValue, setWeightValue] = useState(exercise.defaultWeight?.value ?? 0)
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(exercise.defaultWeight?.unit ?? 'kg')
  const [durationSec, setDurationSec] = useState(exercise.defaultDurationSec ?? 0)
  const [saved, setSaved] = useState(false)

  const weightStep = weightUnit === 'kg' ? 1 : 11

  function handleWeightChange(next: number) {
    setWeightValue(next)
    setSaved(false)
  }

  function handleWeightUnitChange(unit: WeightUnit) {
    if (unit === weightUnit) return
    setWeightUnit(unit)
    setWeightValue(0)
    setSaved(false)
  }

  async function handleSave() {
    await updateExerciseDefaults(exercise.id, {
      defaultSets: sets > 0 ? sets : undefined,
      defaultReps: reps > 0 ? reps : undefined,
      defaultWeight: weightValue > 0 ? { value: weightValue, unit: weightUnit } : undefined,
      defaultDurationSec: durationSec > 0 ? durationSec : undefined,
    })
    setSaved(true)
  }

  return (
    <div>
      <dt className="text-sm text-zinc-400">Nilai default</dt>
      <div className="flex gap-2 py-3">
        <div className="flex flex-1 flex-col gap-1">
          <NumberStepper
            label="Set"
            value={sets}
            step={1}
            onChange={(v) => {
              setSets(v)
              setSaved(false)
            }}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          {hasRepsField(exercise.measurement) && (
            <NumberStepper
              label="Rep"
              value={reps}
              step={1}
              onChange={(v) => {
                setReps(v)
                setSaved(false)
              }}
            />
          )}
          {hasDurationField(exercise.measurement) && (
            <NumberStepper
              label="Durasi (dtk)"
              value={durationSec}
              step={5}
              onChange={(v) => {
                setDurationSec(v)
                setSaved(false)
              }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-3">
        {hasWeightField(exercise.measurement) && (
          <div className="flex items-end gap-1">
            <NumberStepper
              label={`Beban (${weightUnit})`}
              value={weightValue}
              step={weightStep}
              onChange={handleWeightChange}
            />
            <div className="flex overflow-hidden rounded-lg bg-zinc-800 text-xs">
              {(['kg', 'lb'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  onClick={() => handleWeightUnitChange(unit)}
                  className={`h-10 px-2 font-medium ${
                    weightUnit === unit ? 'bg-primary-500 text-white' : 'text-zinc-400'
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 py-3">
        <button
          type="button"
          onClick={handleSave}
          className="h-11 rounded-lg bg-zinc-800 px-3 text-sm font-medium text-primary-400"
        >
          {saved ? 'Tersimpan' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}
