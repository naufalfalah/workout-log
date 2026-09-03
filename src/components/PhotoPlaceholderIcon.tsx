export default function PhotoPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x={3} y={5} width={18} height={14} rx={2} stroke="currentColor" strokeWidth={1.6} />
      <circle cx={9} cy={11} r={1.5} stroke="currentColor" strokeWidth={1.6} />
      <path
        d="m5 17 4.5-4.5a2 2 0 0 1 2.8 0L19 19"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
