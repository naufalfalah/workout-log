import { ulid } from 'ulid'
import type { Routine } from '../../domain/types'

// Data contoh untuk pengembangan awal, hanya ditambahkan sekali saat
// database pertama kali dibuat (lihat db/schema.ts, event 'populate').
export function routinesSeed(): Routine[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'routine_push_day_a',
      name: 'Push Day A',
      tags: ['push', 'upper'],
      timesPerformed: 12,
      createdAt: now,
      updatedAt: now,
      blocks: [
        {
          id: ulid(),
          label: 'Bench Press',
          config: { kind: 'straight' },
          items: [
            {
              id: ulid(),
              exerciseId: 'ex_bench_press',
              targetSets: 5,
              targetReps: { type: 'fixed', value: 5 },
            },
          ],
        },
        {
          id: ulid(),
          label: 'Overhead Press',
          config: { kind: 'straight' },
          items: [
            {
              id: ulid(),
              exerciseId: 'ex_ohp',
              targetSets: 3,
              targetReps: { type: 'fixed', value: 8 },
            },
          ],
        },
      ],
    },
  ]
}
