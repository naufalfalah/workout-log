import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import PageContainer from '@/app/PageContainer'
import type { Equipment, MuscleGroup, WeightUnit } from '@/domain/types'
import { readImageAsDataUrl } from '@/lib/imageFile'
import {
  equipmentOptions,
  hasDurationField,
  hasRepsField,
  hasWeightField,
  label,
  muscleOptions,
} from '@/components/exerciseLabels'
import NumberStepper from '@/components/NumberStepper'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import { addExercise } from './exercises.store'

export default function ExerciseFormPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState<Equipment>('bodyweight')
  const [measurement, setMeasurement] = useState<'weight_reps' | 'reps' | 'duration'>('weight_reps')
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>('chest')
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined)
  const [defaultSets, setDefaultSets] = useState(0)
  const [defaultReps, setDefaultReps] = useState(0)
  const [defaultWeightValue, setDefaultWeightValue] = useState(0)
  const [defaultWeightUnit, setDefaultWeightUnit] = useState<WeightUnit>('kg')
  const [defaultDurationSec, setDefaultDurationSec] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const weightStep = defaultWeightUnit === 'kg' ? 1 : 11

  function handleWeightUnitChange(unit: WeightUnit) {
    if (unit === defaultWeightUnit) return
    setDefaultWeightUnit(unit)
    setDefaultWeightValue(0)
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImageUrl(await readImageAsDataUrl(file))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat gambar.')
    } finally {
      e.target.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (name.trim() === '') {
      setError('Nama gerakan wajib diisi.')
      return
    }
    const id = await addExercise({
      name: name.trim(),
      equipment,
      measurement,
      primaryMuscles: [primaryMuscle],
      imageUrl,
      defaultSets: defaultSets > 0 ? defaultSets : undefined,
      defaultReps: defaultReps > 0 ? defaultReps : undefined,
      defaultWeight:
        defaultWeightValue > 0 ? { value: defaultWeightValue, unit: defaultWeightUnit } : undefined,
      defaultDurationSec: defaultDurationSec > 0 ? defaultDurationSec : undefined,
    })
    navigate(`/exercises/${id}`)
  }

  return (
    <PageContainer variant="form">
      <header className="pt-2">
        <Link to="/exercises" className="text-sm text-zinc-400 md:hidden">
          &larr; Pustaka Gerakan
        </Link>
        <h1 className="text-2xl font-semibold">Gerakan Baru</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Gambar</span>
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                <PhotoPlaceholderIcon className="h-6 w-6" />
              </div>
            )}
            <label className="flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg bg-zinc-800 text-sm text-zinc-300">
              {imageUrl ? 'Ganti gambar' : 'Tambah gambar'}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                aria-label="Hapus gambar"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="exercise-name" className="text-xs text-zinc-500">
            Nama gerakan
          </label>
          <input
            id="exercise-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama gerakan"
            className="h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none"
          />
        </div>

        <div className="flex gap-2">
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="exercise-equipment" className="text-xs text-zinc-500">
              Alat
            </label>
            <select
              id="exercise-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as Equipment)}
              className="h-11 w-full rounded-lg bg-zinc-800 px-3 text-sm outline-none"
            >
              {equipmentOptions.map((eq) => (
                <option key={eq} value={eq}>
                  {label(eq)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label htmlFor="exercise-muscle" className="text-xs text-zinc-500">
              Otot utama
            </label>
            <select
              id="exercise-muscle"
              value={primaryMuscle}
              onChange={(e) => setPrimaryMuscle(e.target.value as MuscleGroup)}
              className="h-11 w-full rounded-lg bg-zinc-800 px-3 text-sm outline-none"
            >
              {muscleOptions.map((m) => (
                <option key={m} value={m}>
                  {label(m)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="exercise-measurement" className="text-xs text-zinc-500">
            Cara diukur
          </label>
          <select
            id="exercise-measurement"
            value={measurement}
            onChange={(e) => setMeasurement(e.target.value as 'weight_reps' | 'reps' | 'duration')}
            className="h-11 rounded-lg bg-zinc-800 px-3 text-sm outline-none"
          >
            <option value="weight_reps">Beban + reps</option>
            <option value="reps">Reps saja (bodyweight)</option>
            <option value="duration">Durasi (isometrik/plank)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-zinc-500">Nilai default (opsional)</span>
          <div className="flex gap-2 py-2">
            <div className="flex flex-1 flex-col gap-1">
              <NumberStepper label="Set" value={defaultSets} step={1} onChange={setDefaultSets} />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              {hasRepsField(measurement) && (
                <NumberStepper label="Rep" value={defaultReps} step={1} onChange={setDefaultReps} />
              )}
              {hasDurationField(measurement) && (
                <NumberStepper
                  label="Durasi (dtk)"
                  value={defaultDurationSec}
                  step={5}
                  onChange={setDefaultDurationSec}
                />
              )}
            </div>
          </div>

          {hasWeightField(measurement) && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="flex items-end gap-1">
                <NumberStepper
                  label={`Beban (${defaultWeightUnit})`}
                  value={defaultWeightValue}
                  step={weightStep}
                  onChange={setDefaultWeightValue}
                />
                <div className="flex overflow-hidden rounded-lg bg-zinc-800 text-xs">
                  {(['kg', 'lb'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => handleWeightUnitChange(unit)}
                      className={`h-10 px-2 font-medium ${
                        defaultWeightUnit === unit ? 'bg-primary-500 text-white' : 'text-zinc-400'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Link
            to="/exercises"
            className="flex h-11 flex-1 items-center justify-center rounded-lg bg-zinc-800 text-sm text-zinc-300"
          >
            Batal
          </Link>
          <button
            type="submit"
            className="h-11 flex-1 rounded-lg bg-primary-500 text-sm font-medium text-white"
          >
            Simpan gerakan
          </button>
        </div>
      </form>
    </PageContainer>
  )
}
