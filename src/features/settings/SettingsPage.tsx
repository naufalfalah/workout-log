import PageContainer from '@/app/PageContainer'
import ExportPanel from '../backup/ExportPanel'
import ImportPanel from '../backup/ImportPanel'
import IosInstallGuide from './IosInstallGuide'

export default function SettingsPage() {
  return (
    <PageContainer>
      <header className="pt-2">
        <h1 className="text-2xl font-semibold">Pengaturan</h1>
      </header>

      <ExportPanel />

      <ImportPanel />

      <IosInstallGuide />

      <section className="flex flex-col gap-1 rounded-xl bg-zinc-900 p-4">
        <h2 className="text-sm font-medium text-zinc-400">Tentang</h2>
        <p className="text-sm text-zinc-500">
          Workout Log menyimpan seluruh data langsung di perangkat ini (IndexedDB) — tanpa akun,
          tanpa server, dan tidak ada data yang dikirim ke mana pun.
        </p>
      </section>
    </PageContainer>
  )
}
