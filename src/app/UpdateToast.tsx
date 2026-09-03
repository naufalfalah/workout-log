import { useSyncExternalStore } from 'react'
import { applyUpdate, dismissUpdate, getNeedsRefresh, subscribe } from './updateToastStore'

export default function UpdateToast() {
  const needsRefresh = useSyncExternalStore(subscribe, getNeedsRefresh)

  if (!needsRefresh) return null

  return (
    <div
      role="status"
      className="fixed inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-30 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-zinc-800 p-3 shadow-lg shadow-black/40 md:left-[15rem] md:right-4 md:mx-0 md:max-w-sm"
    >
      <p className="flex-1 text-sm text-zinc-100">Versi baru tersedia.</p>
      <button
        type="button"
        onClick={dismissUpdate}
        className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-zinc-400 active:bg-zinc-700"
      >
        Nanti
      </button>
      <button
        type="button"
        onClick={applyUpdate}
        className="shrink-0 rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-medium text-white active:bg-primary-600"
      >
        Muat ulang
      </button>
    </div>
  )
}
