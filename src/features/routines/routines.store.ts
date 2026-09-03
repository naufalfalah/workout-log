import { useLiveQuery } from 'dexie-react-hooks'
import { ulid } from 'ulid'
import { db } from '../../db/schema'
import type { Routine, RoutineBlock } from '../../domain/types'

export interface RoutineDraft {
  name: string
  tags: string[]
  blocks: RoutineBlock[]
}

export function useRoutines(): Routine[] {
  return useLiveQuery(() => db.routines.toArray(), []) ?? []
}

// Pengambilan sekali (bukan live query) untuk memuat data awal form edit —
// dipakai lewat useEffect supaya state form hanya di-seed sekali, bukan
// ditimpa ulang tiap kali data di DB berubah.
export async function getRoutine(id: string): Promise<Routine | undefined> {
  return db.routines.get(id)
}

export async function addRoutine(draft: RoutineDraft): Promise<string> {
  const now = new Date().toISOString()
  const id = ulid()
  const routine: Routine = {
    id,
    ...draft,
    timesPerformed: 0,
    createdAt: now,
    updatedAt: now,
  }
  await db.routines.add(routine)
  return id
}

export async function updateRoutine(id: string, draft: RoutineDraft): Promise<void> {
  await db.routines.update(id, {
    ...draft,
    updatedAt: new Date().toISOString(),
  })
}

export async function removeRoutine(id: string): Promise<void> {
  await db.routines.delete(id)
}
