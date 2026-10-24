import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

const base =
  'inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60'

const variants = {
  primary: 'bg-brand-ink text-brand-paper hover:bg-neutral-800',
  light: 'bg-brand-paper text-brand-ink hover:bg-brand-warm',
  outline: 'border border-brand-ink text-brand-ink hover:bg-brand-ink/10',
  outlineLight: 'border border-brand-paper text-brand-paper hover:bg-brand-paper/10',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({ variant = 'primary', type = 'button', className = '', ...props }: ButtonProps) {
  return <button type={type} className={`${base} ${variants[variant]} ${className}`} {...props} />
}

type ButtonLinkProps = {
  to: string
  variant?: keyof typeof variants
  className?: string
  onClick?: () => void
  children: ReactNode
}

export function ButtonLink({ to, variant = 'primary', className = '', onClick, children }: ButtonLinkProps) {
  return (
    <Link to={to} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  )
}