import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

import { exportAllData, useLastExportAt } from './export'

export default function ExportPanel() {
  const lastExportAt = useLastExportAt()

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-zinc-900 p-4">
      <h2 className="text-sm font-medium text-zinc-400">Ekspor Data</h2>
      <p className="text-sm text-zinc-500">
        {lastExportAt
          ? `Ekspor terakhir: ${format(new Date(lastExportAt), 'd MMMM yyyy, HH:mm', {
              locale: localeId,
            })}`
          : 'Kamu belum pernah ekspor data.'}
      </p>
      <button
        type="button"
        onClick={() => exportAllData()}
        className="mt-1 h-12 rounded-xl bg-primary-500 text-sm font-semibold text-white active:bg-primary-600"
      >
        Ekspor File
      </button>
      <p className="text-xs text-zinc-600">
        Seluruh data (gerakan, routine, dan riwayat sesi) diunduh sebagai satu file JSON. Lakukan
        secara berkala supaya data tidak hilang kalau perangkat berganti atau data browser terhapus.
      </p>
    </section>
  )
}
