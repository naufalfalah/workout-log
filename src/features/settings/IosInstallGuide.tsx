// iOS Safari tidak mendukung event `beforeinstallprompt` (API standar PWA
// install banner) — satu-satunya cara memasang ke Layar Utama di iOS
// adalah lewat menu Share bawaan Safari, jadi perlu instruksi manual
// bergambar di sini. Deteksi lewat UA + `navigator.standalone` karena
// belum ada API resmi untuk mendeteksi "iOS Safari, belum terpasang".
function isIosSafariNotInstalled(): boolean {
  if (typeof navigator === 'undefined') return false
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone =
    'standalone' in navigator && (navigator as unknown as { standalone?: boolean }).standalone
  return isIos && !isStandalone
}

const steps = [
  {
    icon: ShareIcon,
    title: 'Ketuk ikon Bagikan',
    description:
      'Di bilah alat Safari (bagian bawah layar), ketuk ikon kotak dengan panah ke atas.',
  },
  {
    icon: AddSquareIcon,
    title: 'Pilih "Tambah ke Layar Utama"',
    description: 'Gulir daftar menu ke bawah sampai menemukan opsi ini.',
  },
  {
    icon: CheckIcon,
    title: 'Ketuk "Tambah"',
    description: 'Konfirmasi di pojok kanan atas — ikon aplikasi akan muncul di Layar Utama.',
  },
]

export default function IosInstallGuide() {
  if (!isIosSafariNotInstalled()) return null

  return (
    <section className="flex flex-col gap-3 rounded-xl bg-zinc-900 p-4">
      <h2 className="text-sm font-medium text-zinc-400">Instal ke Layar Utama (iOS)</h2>
      <p className="text-sm text-zinc-500">
        Kamu sedang membuka lewat Safari. Pasang sebagai aplikasi supaya bisa dibuka langsung dari
        Layar Utama dan tetap berfungsi tanpa koneksi internet.
      </p>
      <ol className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-primary-400">
              <step.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-100">
                {i + 1}. {step.title}
              </p>
              <p className="text-xs text-zinc-500">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3v12M8 7l4-4 4 4"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function AddSquareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x={4} y={4} width={16} height={16} rx={3} stroke="currentColor" strokeWidth={1.8} />
      <path d="M12 8.5v7M8.5 12h7" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
