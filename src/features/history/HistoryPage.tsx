import { useCallback, useEffect, useRef, useState } from 'react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import ConfirmDialog from '@/app/ConfirmDialog'
import PageContainer from '@/app/PageContainer'
import type { DailyWorkoutResult } from '@/db/schema'
import { formatWorkoutEntrySummary, label } from '@/components/exerciseLabels'
import PhotoPlaceholderIcon from '@/components/PhotoPlaceholderIcon'
import SwipeToDelete from '@/components/SwipeToDelete'
import { useExercises } from '../exercises/exercises.store'
import {
  deleteDailyWorkoutResult,
  fetchDailyWorkoutResultsPage,
} from '../session/dailyWorkoutResults.store'

const PAGE_SIZE = 10

export default function HistoryPage() {
  const exercises = useExercises()

  const [sessions, setSessions] = useState<DailyWorkoutResult[]>([])
  const [initialized, setInitialized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const offsetRef = useRef(0)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return
    loadingRef.current = true
    setLoading(true)

    const page = await fetchDailyWorkoutResultsPage(offsetRef.current, PAGE_SIZE)
    offsetRef.current += page.length
    setSessions((prev) => [...prev, ...page])

    const more = page.length === PAGE_SIZE
    hasMoreRef.current = more
    setHasMore(more)
    loadingRef.current = false
    setLoading(false)
  }, [])

  useEffect(() => {
    loadMore().then(() => setInitialized(true))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmDelete() {
    if (!deleteTarget) return
    const date = deleteTarget
    setDeleteTarget(null)

    await deleteDailyWorkoutResult(date)
    setSessions((prev) => prev.filter((session) => session.date !== date))
    // Menghapus satu baris menggeser posisi baris-baris berikutnya di query
    // terurut — offset paginasi harus ikut mundur satu supaya loadMore
    // berikutnya tidak melompati satu baris yang belum sempat ditampilkan.
    offsetRef.current = Math.max(0, offsetRef.current - 1)
  }

  const sentinelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      if (!node) return

      observerRef.current = new IntersectionObserver(
        (observedEntries) => {
          if (observedEntries[0].isIntersecting) loadMore()
        },
        { rootMargin: '200px' },
      )
      observerRef.current.observe(node)
    },
    [loadMore],
  )

  return (
    <PageContainer>
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">Riwayat</h1>
      </header>

      {!initialized ? (
        <p className="mt-8 text-center text-zinc-500">Memuat...</p>
      ) : sessions.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500">
          Riwayat sesi akan muncul di sini setelah kamu menyimpan hasil latihan.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <SwipeToDelete key={session.date} onDelete={() => setDeleteTarget(session.date)}>
              <div className="flex flex-col gap-3 bg-zinc-900 p-3">
                <p className="font-medium">
                  {format(new Date(session.date), 'EEEE, d MMMM yyyy', {
                    locale: localeId,
                  })}
                </p>

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
                            {exercise ? exercise.name : label(entry.exerciseId)}
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
            </SwipeToDelete>
          ))}

          <div ref={sentinelCallbackRef} className="h-1" />

          {loading && <p className="pb-2 text-center text-sm text-zinc-500">Memuat lagi...</p>}
          {!hasMore && (
            <p className="pb-2 text-center text-sm text-zinc-600">
              Sudah menampilkan semua riwayat.
            </p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus riwayat ini?"
        message="Hasil latihan pada tanggal ini akan dihapus permanen dan tidak bisa dikembalikan."
        confirmLabel="Hapus"
        cancelLabel="Batal"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  )
}
