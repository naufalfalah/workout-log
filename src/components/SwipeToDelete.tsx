import { useRef, useState } from 'react'

const ACTION_WIDTH = 88
const OPEN_THRESHOLD = ACTION_WIDTH / 2
const MOVE_THRESHOLD = 4

export default function SwipeToDelete({
  children,
  onDelete,
  deleteLabel = 'Hapus',
  className = '',
}: {
  children: React.ReactNode
  onDelete: () => void
  deleteLabel?: string
  className?: string
}) {
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)

  const startX = useRef(0)
  const startDragX = useRef(0)
  const pointerId = useRef<number | null>(null)
  const dragXRef = useRef(0)
  const openRef = useRef(false)
  const movedRef = useRef(false)
  const ignoreNextClick = useRef(false)

  function setPosition(next: number) {
    dragXRef.current = next
    openRef.current = next <= -OPEN_THRESHOLD
    setDragX(next)
  }

  function close() {
    setPosition(0)
  }

  function handlePointerDown(e: React.PointerEvent) {
    // Swipe hanya untuk sentuh/pena. Mouse dibiarkan lewat sepenuhnya (tidak
    // ada setPointerCapture, tidak ada tracking gerak). Tombol
    // hapus untuk mouse disediakan lewat tombol hover terpisah di bawah.
    if (e.pointerType === 'mouse') return
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerId.current = e.pointerId
    startX.current = e.clientX
    startDragX.current = dragXRef.current
    movedRef.current = false
    setDragging(true)
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (pointerId.current !== e.pointerId) return
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > MOVE_THRESHOLD) movedRef.current = true
    const next = Math.min(0, Math.max(-ACTION_WIDTH, startDragX.current + delta))
    setPosition(next)
  }

  function endDrag(e: React.PointerEvent) {
    if (pointerId.current !== e.pointerId) return
    pointerId.current = null
    setDragging(false)
    const wasOpen = startDragX.current <= -OPEN_THRESHOLD
    const shouldOpen = dragXRef.current <= -OPEN_THRESHOLD
    ignoreNextClick.current = !wasOpen && shouldOpen
    setPosition(shouldOpen ? -ACTION_WIDTH : 0)
  }

  function handleClickCapture(e: React.MouseEvent) {
    const skipClose = ignoreNextClick.current
    ignoreNextClick.current = false
    if (movedRef.current || openRef.current) {
      e.preventDefault()
      e.stopPropagation()
      if (!skipClose) close()
      movedRef.current = false
    }
  }

  return (
    <div className={`group relative overflow-hidden rounded-xl ${className}`}>
      <button
        type="button"
        onClick={() => {
          onDelete()
          close()
        }}
        aria-label={deleteLabel}
        style={{ width: ACTION_WIDTH }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-sm font-medium text-white active:bg-red-600"
      >
        {deleteLabel}
      </button>
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
        className="select-none"
        style={{
          transform: `translateX(${dragX}px)`,
          transition: dragging ? 'none' : 'transform 200ms ease',
          touchAction: 'pan-y',
        }}
      >
        {children}
      </div>
      {/* Pengganti swipe untuk mouse (desktop): swipe di atas sengaja
          dimatikan untuk pointerType mouse, jadi tombol hapus di sini
          muncul lewat hover supaya kemampuan hapus tetap ada. */}
      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        className="absolute right-2 top-2 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-400 opacity-0 shadow-md transition-opacity group-hover:opacity-100 hover:bg-red-500 hover:text-white md:flex"
      >
        &times;
      </button>
    </div>
  )
}
