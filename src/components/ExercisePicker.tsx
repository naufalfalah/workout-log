import { useEffect, useRef, useState } from 'react'

import type { Exercise } from '@/domain/types'
import { label } from './exerciseLabels'
import PhotoPlaceholderIcon from './PhotoPlaceholderIcon'

interface ExercisePickerProps {
  exercises: Exercise[]
  value: string
  onChange: (exerciseId: string) => void
  placeholder?: string
  className?: string
}

export default function ExercisePicker({
  exercises,
  value,
  onChange,
  placeholder = 'Pilih gerakan',
  className,
}: ExercisePickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = exercises.find((ex) => ex.id === value)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-2 rounded-lg bg-zinc-800 px-2 text-left"
      >
        {selected?.imageUrl ? (
          <img
            src={selected.imageUrl}
            alt=""
            className="h-8 w-8 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-zinc-700 text-zinc-500">
            <PhotoPlaceholderIcon className="h-4 w-4" />
          </div>
        )}
        <span className="min-w-0 flex-1 truncate text-base text-zinc-100">
          {selected ? selected.name : placeholder}
        </span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-lg bg-zinc-800 p-1 shadow-lg shadow-black/40"
        >
          {exercises.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500">Tidak ada gerakan.</li>
          ) : (
            exercises.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={ex.id === value}
                  onClick={() => handleSelect(ex.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left active:bg-zinc-700 ${
                    ex.id === value ? 'bg-zinc-700' : ''
                  }`}
                >
                  {ex.imageUrl ? (
                    <img
                      src={ex.imageUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-900 text-zinc-600">
                      <PhotoPlaceholderIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{ex.name}</p>
                    <p className="truncate text-xs text-zinc-400">
                      {ex.primaryMuscles.map(label).join(', ') || 'Otot tidak diketahui'}
                    </p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
