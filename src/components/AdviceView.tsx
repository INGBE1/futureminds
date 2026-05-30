import { ArrowRight, Check, Minus, Sparkles, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import type { PurchaseAdvice } from '../types'
import { formatDelay, formatEUR } from '../lib/finance'

const verdictMeta = {
  confirm: { label: 'Raisonnable', cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  reconsider: { label: 'À réfléchir', cls: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  avoid: { label: 'À éviter', cls: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
} as const

interface Props {
  advice: PurchaseAdvice
  amount: number
  onConfirm: () => void
  onCancel: () => void
  onPickAlternative: (name: string, price: number) => void
}

export function AdviceView({ advice, amount, onConfirm, onCancel, onPickAlternative }: Props) {
  const v = verdictMeta[advice.verdict]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${v.cls}`}>
          <span className={`h-2 w-2 rounded-full ${v.dot}`} />
          {v.label}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
          <Sparkles size={12} />
          {advice.source === 'ai' ? 'Conseil IA' : 'Conseil local'}
        </span>
      </div>

      <p className="text-sm leading-relaxed text-slate-700">{advice.summary}</p>

      {advice.goalDelayDays > 0 && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          ⏳ Ton objectif prioritaire sera retardé de{' '}
          <strong>{formatDelay(advice.goalDelayDays)}</strong>.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <Section title="Pour" Icon={ThumbsUp} tone="pos" items={advice.pros} />
        <Section title="Contre" Icon={ThumbsDown} tone="neg" items={advice.cons} />
      </div>

      {advice.alternative && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-brand-600">
            Alternative suggérée
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-slate-800">{advice.alternative.name}</span>
            <span className="text-sm font-bold text-brand-700">
              {formatEUR(advice.alternative.price)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">{advice.alternative.why}</p>
          <button
            onClick={() => onPickAlternative(advice.alternative!.name, advice.alternative!.price)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
          >
            Choisir cette alternative <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          <X size={16} /> Annuler
        </button>
        <button
          onClick={onConfirm}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
        >
          <Check size={16} /> Confirmer · {formatEUR(amount)}
        </button>
      </div>
    </div>
  )
}

function Section({
  title,
  items,
  tone,
  Icon,
}: {
  title: string
  items: string[]
  tone: 'pos' | 'neg'
  Icon: typeof ThumbsUp
}) {
  const color = tone === 'pos' ? 'text-emerald-600' : 'text-rose-500'
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${color}`}>
        <Icon size={14} /> {title}
      </div>
      <ul className="space-y-1.5">
        {items.length === 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-400">
            <Minus size={14} className="mt-0.5 shrink-0" /> —
          </li>
        )}
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'pos' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  )
}
