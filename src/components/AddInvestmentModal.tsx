import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatEUR } from '../lib/finance'
import type { Product, RiskLevel } from '../types'
import {
  DURATIONS,
  RISK_META,
  TYPE_META,
  formatDuration,
  futureValue,
  productsForRisk,
} from '../lib/invest'

const RISKS: RiskLevel[] = ['low', 'moderate', 'high']

export function AddInvestmentModal({ onClose }: { onClose: () => void }) {
  const { account, addInvestment } = useApp()
  const [risk, setRisk] = useState<RiskLevel>('moderate')
  const [selected, setSelected] = useState<Product | null>(null)
  const [amountStr, setAmountStr] = useState('')
  const [months, setMonths] = useState<number>(36)

  const products = productsForRisk(risk)
  const amount = parseFloat(amountStr.replace(',', '.')) || 0
  const tooMuch = amount > account.investCash
  const canSubmit = selected !== null && amount > 0 && !tooMuch

  const projected =
    selected && amount > 0
      ? futureValue({ amount, annualRate: selected.annualRate, months })
      : 0

  function handleSubmit() {
    if (!canSubmit || !selected) return
    addInvestment(selected, amount, months)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-white p-5 shadow-soft no-scrollbar sm:rounded-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Nouvel investissement</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-2.5 text-xs text-slate-500">
            Cash à investir : <strong>{formatEUR(account.investCash)}</strong>
          </div>

          {/* 1. Niveau de risque */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Niveau de risque</label>
            <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
              {RISKS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRisk(r)
                    setSelected(null)
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                    risk === r ? 'brand-gradient text-white shadow-soft' : 'text-slate-500'
                  }`}
                >
                  {RISK_META[r].label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Produits proposés */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500">Produits proposés</label>
            {products.map((p) => {
              const active = selected?.id === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    active ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-xl">{TYPE_META[p.type].emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-slate-800">{p.name}</div>
                    <div className="truncate text-xs text-slate-400">{p.description}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-bold text-emerald-600">
                      ~{Math.round(p.annualRate * 100)} %/an
                    </div>
                    <div className="text-[10px] text-slate-400">{TYPE_META[p.type].label}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 3. Somme + durée */}
          {selected && (
            <>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Somme à investir (€)</label>
                <input
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                {tooMuch && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    Supérieur à ton cash à investir. Ajoute des fonds d'abord.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-500">Durée</label>
                <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setMonths(d)}
                      className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                        months === d ? 'brand-gradient text-white shadow-soft' : 'text-slate-500'
                      }`}
                    >
                      {formatDuration(d)}
                    </button>
                  ))}
                </div>
              </div>

              {projected > 0 && (
                <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  📈 Valeur projetée à {formatDuration(months)} : <strong>{formatEUR(projected)}</strong>{' '}
                  <span className="text-emerald-600">(+{formatEUR(projected - amount)})</span>
                </div>
              )}
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Investir {canSubmit ? formatEUR(amount) : ''}
          </button>

          <p className="text-center text-[10px] leading-relaxed text-slate-400">
            Démonstration — les rendements sont indicatifs et ne constituent pas un conseil en
            investissement.
          </p>
        </div>
      </div>
    </div>
  )
}
