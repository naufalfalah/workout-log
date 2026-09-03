import { useState } from 'react'
import { Link } from 'react-router-dom'

import ConfirmDialog from '@/app/ConfirmDialog'
import PageContainer from '@/app/PageContainer'
import SwipeToDelete from '@/components/SwipeToDelete'
import { removeRoutine, useRoutines } from './routines.store'

export default function RoutineListPage() {
  const routines = useRoutines()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const routineToDelete = routines.find((routine) => routine.id === deleteTarget)

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    await removeRoutine(id)
  }

  return (
    <PageContainer>
      <header className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-2xl font-semibold">Routine</h1>
        </div>
        <Link
          to="/routines/new"
          className="flex h-11 items-center rounded-xl bg-primary-500 px-4 font-medium text-white active:bg-primary-600"
        >
          + Tambah
        </Link>
      </header>

      {routines.length === 0 ? (
        <p className="mt-8 text-center text-zinc-500">Belum ada routine. Buat yang pertama.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine) => (
            <li key={routine.id}>
              <SwipeToDelete onDelete={() => setDeleteTarget(routine.id)}>
                <Link
                  to={`/routines/${routine.id}/edit`}
                  className="flex items-center justify-between bg-zinc-900 px-4 py-3 active:bg-zinc-800"
                >
                  <div>
                    <p className="font-medium">{routine.name}</p>
                    <p className="text-sm text-zinc-400">
                      {routine.tags.length > 0 ? routine.tags.join(' · ') : 'Tanpa tag'}
                    </p>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {routine.items?.length ?? 0} gerakan
                  </span>
                </Link>
              </SwipeToDelete>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Hapus routine ini?"
        message={`Routine "${routineToDelete?.name ?? ''}" akan dihapus permanen dan tidak bisa dikembalikan.`}
        confirmLabel="Hapus"
        cancelLabel="Batal"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  )
}
