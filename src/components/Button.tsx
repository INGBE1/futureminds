import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  full?: boolean
}

const styles: Record<Variant, string> = {
  primary: 'brand-gradient text-white shadow-soft hover:brightness-105 active:brightness-95',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
}

export function Button({
  variant = 'primary',
  full = false,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        styles[variant]
      } ${full ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
