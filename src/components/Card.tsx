import type { HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className = '', children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-4xl bg-white p-5 shadow-soft ring-1 ring-slate-100 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
