import { useState } from 'react'
import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Goal } from '../types'
import { formatEUR } from '../lib/finance'

export function AddMoneyModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { account, addToGoal } = useApp()
  const [amountStr, setAmountStr] = useState('')

  const amount = parseFloat(amountStr.replace(',', '.')) || 0
  const remaining = Math.max(0, goal.target - goal.saved)
  const tooMuch = amount > account.balance
  const canSubmit = amount > 0 && !tooMuch

  const quick = [10, 25, 50, 100].filter((q) => q <= account.balance)

  function handleSubmit() {
    if (!canSubmit) return
    addToGoal(goal.id, amount)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-4xl bg-white p-5 shadow-soft sm:rounded-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <span className="text-xl">{goal.emoji}</span> {goal.name}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            Déjà épargné {formatEUR(goal.saved)} / {formatEUR(goal.target)} · reste{' '}
            {formatEUR(remaining)}
            <br />
            Solde disponible : <strong>{formatEUR(account.balance)}</strong>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Montant à ajouter (€)</label>
            <input
              inputMode="decimal"
              autoFocus
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
            {tooMuch && (
              <p className="mt-1 text-xs font-medium text-rose-600">Montant supérieur à ton solde.</p>
            )}
          </div>

          {quick.length > 0 && (
            <div className="flex gap-2">
              {quick.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmountStr(String(q))}
                  className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                >
                  +{q} €
                </button>
              ))}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ajouter {amount > 0 ? formatEUR(amount) : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
