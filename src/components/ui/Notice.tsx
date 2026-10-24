import type { ReactNode } from 'react'

const tones = {
  info: 'border-blue-700 bg-blue-50',
  warning: 'border-amber-700 bg-amber-50',
  error: 'border-red-700 bg-red-50',
  success: 'border-green-700 bg-green-50',
}

type NoticeProps = {
  tone?: keyof typeof tones
  title?: string
  children: ReactNode
}

export function Notice({ tone = 'info', title, children }: NoticeProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-md border-l-4 p-4 text-sm text-brand-ink ${tones[tone]}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div>{children}</div>
    </div>
  )
}