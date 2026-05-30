import { useState } from 'react'
import { ArrowUpRight, Plus, Wallet } from 'lucide-react'
import { useApp, priorityGoal } from '../context/AppContext'
import { Card } from '../components/Card'
import { PayModal } from '../components/PayModal'
import { formatEUR, goalProgress } from '../lib/finance'

export function Home() {
  const { account, goals, transactions } = useApp()
  const [payOpen, setPayOpen] = useState(false)
  const goal = priorityGoal(goals)
  const recent = transactions.slice(0, 3)

  return (
    <div className="space-y-5">
      {/* Carte de solde */}
      <div className="relative overflow-hidden rounded-4xl brand-gradient p-6 text-white shadow-soft">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <Wallet size={16} /> Solde du compte
          </div>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">
            {formatEUR(account.balance)}
          </div>
          <div className="mt-1 text-sm text-white/75">Bonjour {account.holder} 👋</div>

          <button
            onClick={() => setPayOpen(true)}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-bold text-brand-700 shadow-sm transition hover:bg-white/90 active:scale-[0.99]"
          >
            <Plus size={18} /> Payer
          </button>
        </div>
      </div>

      {/* Objectif prioritaire */}
      {goal && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{goal.emoji}</span>
              <div>
                <div className="text-sm font-bold">{goal.name}</div>
                <div className="text-xs text-slate-500">
                  {formatEUR(goal.saved)} / {formatEUR(goal.target)}
                </div>
              </div>
            </div>
            <span className="text-sm font-bold text-brand-600">
              {Math.round(goalProgress(goal) * 100)} %
            </span>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full brand-gradient transition-all"
              style={{ width: `${goalProgress(goal) * 100}%` }}
            />
          </div>
        </Card>
      )}

      {/* Transactions récentes */}
      <div>
        <h2 className="mb-2 px-1 text-sm font-bold text-slate-600">Activité récente</h2>
        <Card className="divide-y divide-slate-100 p-2">
          {recent.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-800">{tx.label}</div>
                <div className="truncate text-xs text-slate-400">{tx.recipient}</div>
              </div>
              <div
                className={`ml-3 shrink-0 text-sm font-bold ${
                  tx.amount < 0 ? 'text-slate-800' : 'text-emerald-600'
                }`}
              >
                {tx.amount < 0 ? '' : '+'}
                {formatEUR(tx.amount)}
              </div>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="px-3 py-6 text-center text-sm text-slate-400">
              Aucune transaction pour l'instant.
            </div>
          )}
        </Card>
      </div>

      <div className="flex items-center justify-center gap-1 text-xs text-slate-400">
        <ArrowUpRight size={12} /> Dépense en conscience, atteins tes objectifs.
      </div>

      {payOpen && <PayModal onClose={() => setPayOpen(false)} />}
    </div>
  )
}
