import { useApp } from '../context/AppContext'
import { Card } from '../components/Card'
import { formatEUR } from '../lib/finance'
import type { TransactionCategory } from '../types'

const categoryEmoji: Record<TransactionCategory, string> = {
  food: '🛒',
  shopping: '🛍️',
  transport: '🚌',
  leisure: '🎉',
  bills: '🧾',
  savings: '🐖',
  other: '💳',
}

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })

export function Transactions() {
  const { transactions } = useApp()

  const groups = transactions.reduce<Record<string, typeof transactions>>((acc, tx) => {
    const key = dateFmt.format(new Date(tx.date))
    ;(acc[key] ??= []).push(tx)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Transactions</h1>

      {Object.entries(groups).map(([day, txs]) => (
        <div key={day}>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
            {day}
          </h2>
          <Card className="divide-y divide-slate-100 p-2">
            {txs.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-3 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-lg">
                  {categoryEmoji[tx.category]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-800">{tx.label}</div>
                  <div className="truncate text-xs text-slate-400">
                    {tx.recipient} · {tx.reason}
                  </div>
                </div>
                <div
                  className={`shrink-0 text-sm font-bold ${
                    tx.amount < 0 ? 'text-slate-800' : 'text-emerald-600'
                  }`}
                >
                  {tx.amount < 0 ? '' : '+'}
                  {formatEUR(tx.amount)}
                </div>
              </div>
            ))}
          </Card>
        </div>
      ))}

      {transactions.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-400">Aucune transaction.</Card>
      )}
    </div>
  )
}
