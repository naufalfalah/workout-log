import { useRef, useState } from 'react'

import ConfirmDialog from '@/app/ConfirmDialog'
import {
  parseImportFile,
  restoreRecoverySnapshot,
  runImport,
  useHasRecoverySnapshot,
  type ImportMode,
  type ImportSummary,
} from './import'
import type { ImportFile } from './importSchema'

type Step =
  | { kind: 'idle' }
  | { kind: 'chooseMode'; file: ImportFile }
  | { kind: 'importing' }
  | { kind: 'result'; summary: ImportSummary }
  | { kind: 'error'; message: string }

export default function ImportPanel() {
  const [step, setStep] = useState<Step>({ kind: 'idle' })
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const hasSnapshot = useHasRecoverySnapshot()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // supaya memilih file yang sama lagi tetap memicu onChange

    if (!file) return

    const text = await file.text()
    const parsed: any = parseImportFile(text)
    if (!parsed.ok) {
      setStep({ kind: 'error', message: parsed.error })
      return
    }

    setStep({ kind: 'chooseMode', file: parsed.file })
  }

  async function handleImport(mode: ImportMode) {
    if (step.kind !== 'chooseMode') return
    setStep({ kind: 'importing' })
    try {
      const summary = await runImport(step.file, mode)
      setStep({ kind: 'result', summary })
    } catch {
      setStep({
        kind: 'error',
        message: 'Impor gagal di tengah jalan. Tidak ada data yang berubah.',
      })
    }
  }

  async function handleRestore() {
    setRestoreDialogOpen(false)
    await restoreRecoverySnapshot()
  }

  const counts =
    step.kind === 'chooseMode'
      ? {
          exercises: step.file.data.exercises.length,
          routines: step.file.data.routines.length,
          dailyExerciseLogs: step.file.data.dailyExerciseLogs.length,
          dailyWorkoutResults: step.file.data.dailyWorkoutResults.length,
        }
      : null

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-4">
      <h2 className="text-sm font-medium text-zinc-400">Impor Data</h2>
      <p className="text-sm text-zinc-500">
        Pulihkan data dari file cadangan JSON yang pernah diekspor sebelumnya.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="mt-1 h-12 rounded-xl bg-zinc-800 text-sm font-semibold text-zinc-200 active:bg-zinc-700"
      >
        Pilih file cadangan
      </button>

      {hasSnapshot && (
        <button
          type="button"
          onClick={() => setRestoreDialogOpen(true)}
          className="h-11 rounded-xl text-sm font-medium text-amber-400 active:bg-zinc-800"
        >
          Pulihkan data sebelum impor terakhir
        </button>
      )}

      {step.kind === 'error' && (
        <div className="mt-1 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {step.message}
        </div>
      )}

      {step.kind === 'chooseMode' && counts && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setStep({ kind: 'idle' })}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5 shadow-xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-100">File cadangan ditemukan</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
              <li>{counts.exercises} gerakan</li>
              <li>{counts.routines} routine</li>
              <li>{counts.dailyExerciseLogs} rencana harian</li>
              <li>{counts.dailyWorkoutResults} hasil latihan</li>
            </ul>
            <p className="mt-3 text-xs text-zinc-500">
              Keadaan data saat ini otomatis disimpan sebagai cadangan sekali pakai sebelum impor
              berjalan, jadi bisa dipulihkan lagi kalau salah pilih.
            </p>

            <div className="mt-5 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => handleImport('merge')}
                className="h-11 rounded-xl bg-primary-500 text-sm font-semibold text-white active:bg-primary-600"
              >
                Gabungkan dengan data saat ini
              </button>
              <button
                type="button"
                onClick={() => handleImport('replace')}
                className="h-11 rounded-xl bg-red-500 text-sm font-semibold text-white active:bg-red-600"
              >
                Ganti total data saat ini
              </button>
              <button
                type="button"
                onClick={() => setStep({ kind: 'idle' })}
                className="h-11 rounded-xl bg-zinc-800 text-sm font-medium text-zinc-300 active:bg-zinc-700"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {step.kind === 'importing' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
        >
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5 text-center shadow-xl shadow-black/40">
            <p className="text-sm text-zinc-300">Mengimpor data...</p>
          </div>
        </div>
      )}

      {step.kind === 'result' && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setStep({ kind: 'idle' })}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-zinc-900 p-5 shadow-xl shadow-black/40"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-100">Impor selesai</h3>
            <ul className="mt-2 flex flex-col gap-1 text-sm text-zinc-400">
              <li>{step.summary.added} ditambah</li>
              <li>{step.summary.updated} diperbarui</li>
              <li>{step.summary.skipped} dilewati</li>
            </ul>
            <button
              type="button"
              onClick={() => setStep({ kind: 'idle' })}
              className="mt-5 h-11 w-full rounded-xl bg-primary-500 text-sm font-semibold text-white active:bg-primary-600"
            >
              Selesai
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={restoreDialogOpen}
        title="Pulihkan cadangan?"
        message="Data saat ini akan diganti dengan keadaan sebelum impor terakhir dijalankan."
        confirmLabel="Pulihkan"
        cancelLabel="Batal"
        danger
        onConfirm={handleRestore}
        onCancel={() => setRestoreDialogOpen(false)}
      />
    </section>
  )
}
