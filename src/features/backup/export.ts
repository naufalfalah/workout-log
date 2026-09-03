import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/db/schema'
import { EXPORT_SCHEMA_VERSION } from './schemaVersion'

export function useLastExportAt(): string | undefined {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  return settings?.lastExportAt
}

export async function exportAllData(): Promise<void> {
  const [exercises, routines, dailyExerciseLogs, dailyWorkoutResults] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.dailyExerciseLogs.toArray(),
    db.dailyWorkoutResults.toArray(),
  ])

  const exportedAt = new Date().toISOString()

  const payload = {
    schema: 'workout-log.export',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt,
    counts: {
      exercises: exercises.length,
      routines: routines.length,
      dailyExerciseLogs: dailyExerciseLogs.length,
      dailyWorkoutResults: dailyWorkoutResults.length,
    },
    data: {
      exercises,
      routines,
      dailyExerciseLogs,
      dailyWorkoutResults,
    },
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)

  // <a download> — fallback yang didukung semua browser (bagian 6.5),
  // File System Access API tidak tersedia di iOS Safari.
  const dateStamp = exportedAt.slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `workout-backup-${dateStamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)

  await db.settings.put({ id: 'app', lastExportAt: exportedAt })
}
