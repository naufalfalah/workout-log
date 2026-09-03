import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Exercise } from '../domain/types'
import ExercisePicker from './ExercisePicker'

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

const exercises: Exercise[] = [
  makeExercise({ id: 'ex_1', name: 'Back Squat', primaryMuscles: ['quads', 'glutes'] }),
  makeExercise({ id: 'ex_2', name: 'Bench Press', primaryMuscles: ['chest', 'triceps'] }),
]

describe('ExercisePicker', () => {
  it('menampilkan placeholder saat belum ada gerakan terpilih', () => {
    render(<ExercisePicker exercises={exercises} value="" onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /pilih gerakan/i })).toBeInTheDocument()
  })

  it('menampilkan gambar, nama, dan otot tiap gerakan saat dropdown dibuka', async () => {
    const user = userEvent.setup()
    render(<ExercisePicker exercises={exercises} value="" onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /pilih gerakan/i }))

    expect(screen.getByRole('listbox')).toBeInTheDocument()
    expect(screen.getByText('Back Squat')).toBeInTheDocument()
    expect(screen.getByText('Quads, Glutes')).toBeInTheDocument()
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.getByText('Chest, Triceps')).toBeInTheDocument()
  })

  it('memanggil onChange dan menutup dropdown saat opsi dipilih', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ExercisePicker exercises={exercises} value="" onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: /pilih gerakan/i }))
    await user.click(screen.getByRole('option', { name: /bench press/i }))

    expect(onChange).toHaveBeenCalledWith('ex_2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('menutup dropdown saat klik di luar komponen', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <ExercisePicker exercises={exercises} value="" onChange={vi.fn()} />
        <button type="button">Di luar</button>
      </div>,
    )

    await user.click(screen.getByRole('button', { name: /pilih gerakan/i }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /di luar/i }))
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
