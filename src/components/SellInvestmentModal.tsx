import { X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatEUR } from '../lib/finance'
import { TYPE_META, currentValue } from '../lib/invest'
import type { Investment } from '../types'

export function SellInvestmentModal({
  inv,
  onClose,
}: {
  inv: Investment
  onClose: () => void
}) {
  const { sellInvestment } = useApp()
  const value = currentValue(inv)
  const gain = Math.round((value - inv.amount) * 100) / 100
  const type = TYPE_META[inv.type]

  function handleConfirm() {
    sellInvestment(inv.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-t-4xl bg-white p-5 shadow-soft sm:rounded-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <span className="text-xl">{type.emoji}</span> Revendre
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Tu t'apprêtes à revendre <strong>{inv.productName}</strong>. Le montant récupéré sera
            recrédité sur ton solde.
          </p>

          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Capital investi</span>
              <span>{formatEUR(inv.amount)}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">Montant récupéré</span>
              <span className="text-lg font-extrabold text-brand-600">{formatEUR(value)}</span>
            </div>
            <div
              className={`mt-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                gain >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}
            >
              {gain >= 0 ? `📈 Gain de ${formatEUR(gain)}` : `📉 Perte de ${formatEUR(Math.abs(gain))}`}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 rounded-2xl brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
            >
              Confirmer la revente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
