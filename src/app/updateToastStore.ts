type Listener = () => void

let needsRefresh = false
let applyUpdateFn: ((reloadPage?: boolean) => Promise<void>) | null = null
const listeners = new Set<Listener>()

function notify() {
  listeners.forEach((listener) => listener())
}

export function announceUpdateAvailable(updateSW: (reloadPage?: boolean) => Promise<void>) {
  applyUpdateFn = updateSW
  needsRefresh = true
  notify()
}

export function getNeedsRefresh(): boolean {
  return needsRefresh
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function applyUpdate() {
  applyUpdateFn?.(true)
}

export function dismissUpdate() {
  needsRefresh = false
  notify()
}
