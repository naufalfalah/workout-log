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
    if (e.pointerType === 'mouse' && e.button !== 0) return
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
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
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
    </div>
  )
}
