import { useState } from 'react'
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { id } from 'date-fns/locale'

import { formatWorkoutEntrySummary } from '@/components/exerciseLabels'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import { useExercises } from '../exercises/exercises.store'
import {
  useDailyWorkoutResultDates,
  useDailyWorkoutResultsForDate,
} from '../session/dailyWorkoutResults.store'

const weekdayLabels = ['S', 'S', 'R', 'K', 'J', 'S', 'M']

function toKey(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export default function LogCalendar() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const sessionDates = useDailyWorkoutResultDates()
  const exercises = useExercises()
  const selectedSessions = useDailyWorkoutResultsForDate(selectedDate ? toKey(selectedDate) : '')

  // Selalu 6 minggu (42 hari) apa pun bulannya
  const gridStart = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 })
  const gridEnd = addDays(gridStart, 41)
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function selectDay(day: Date) {
    setSelectedDate((current) => (current && isSameDay(current, day) ? null : day))
  }

  return (
    <section aria-label="Kalender log latihan" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">
          {format(visibleMonth, 'MMMM yyyy', { locale: id })}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Bulan sebelumnya"
            onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 active:bg-zinc-800"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            aria-label="Bulan berikutnya"
            onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 active:bg-zinc-800"
          >
            &rsaquo;
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 p-3">
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
          {weekdayLabels.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = toKey(day)
            const hasSession = sessionDates.has(key)
            const inMonth = isSameMonth(day, visibleMonth)
            const selected = selectedDate && isSameDay(day, selectedDate)
            return (
              <button
                key={key}
                type="button"
                onClick={() => selectDay(day)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm ${
                  selected
                    ? 'bg-primary-500 text-white'
                    : isToday(day)
                      ? 'bg-zinc-800 text-primary-400'
                      : inMonth
                        ? 'text-zinc-200 active:bg-zinc-800'
                        : 'text-zinc-600 active:bg-zinc-800'
                }`}
              >
                {format(day, 'd')}
                {hasSession && (
                  <span className="absolute bottom-1 flex items-center gap-0.5">
                    {hasSession && (
                      <span
                        className={`h-1 w-1 rounded-full ${
                          selected ? 'bg-white' : 'bg-emerald-400'
                        }`}
                      />
                    )}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-400">
              {format(selectedDate, 'EEEE, d MMMM yyyy', { locale: id })}
            </p>
            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              aria-label="Tutup"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 active:bg-zinc-700"
            >
              &times;
            </button>
          </div>

          {selectedSessions === 'loading' ? (
            <p className="text-sm text-zinc-500">Memuat...</p>
          ) : selectedSessions.length > 0 ? (
            <div className="flex flex-col gap-4">
              {selectedSessions.map((session, index) => (
                <div key={session.id} className="flex flex-col gap-2">
                  {selectedSessions.length > 1 && (
                    <p className="text-xs font-medium text-zinc-500">
                      Sesi {index + 1} · {format(new Date(session.createdAt), 'HH:mm')}
                    </p>
                  )}
                  <ul className="flex flex-col gap-2">
                    {session.entries.map((entry) => {
                      const exercise = exercises.find((ex) => ex.id === entry.exerciseId)
                      return (
                        <li key={entry.exerciseId} className="flex items-center gap-3">
                          {exercise?.imageUrl ? (
                            <img
                              src={exercise.imageUrl}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-600">
                              <PhotoPlaceholderIcon className="h-5 w-5" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {exercise?.name ?? entry.exerciseId}
                            </p>
                            <p className="text-sm text-zinc-400">
                              {formatWorkoutEntrySummary(entry, exercise)}
                            </p>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Tidak ada sesi latihan pada tanggal ini.</p>
          )}
        </div>
      )}
    </section>
  )
}
