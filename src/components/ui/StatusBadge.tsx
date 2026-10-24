const tones = {
  planned: 'bg-brand-warm text-brand-ink',
  sample: 'border border-brand-ink/40 bg-brand-paper text-brand-ink',
  draft: 'bg-neutral-200 text-brand-ink',
  published: 'bg-green-200 text-green-950',
  info: 'bg-brand-paper text-brand-ink',
}

type StatusBadgeProps = {
  label: string
  tone: keyof typeof tones
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  )
}