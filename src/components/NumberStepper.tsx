function roundStep(value: number): number {
  return Math.round(value * 10) / 10
}

export default function NumberStepper({
  label: fieldLabel,
  value,
  step,
  min = 0,
  onChange,
}: {
  label: string
  value: number
  step: number
  min?: number
  onChange: (next: number) => void
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span className="truncate text-xs text-zinc-500">{fieldLabel}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Kurangi ${fieldLabel}`}
          onClick={() => onChange(Math.max(min, roundStep(value - step)))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base text-zinc-300 active:bg-zinc-700"
        >
          &minus;
        </button>
        <span className="w-7 shrink-0 text-center text-sm font-medium tabular-nums">{value}</span>
        <button
          type="button"
          aria-label={`Tambah ${fieldLabel}`}
          onClick={() => onChange(roundStep(value + step))}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-base text-zinc-300 active:bg-zinc-700"
        >
          +
        </button>
      </div>
    </div>
  )
}
