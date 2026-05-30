import { useState } from 'react'
import { Plus, TrendingUp, Wallet } from 'lucide-react'
import { Card } from '../components/Card'
import { AddFundsModal } from '../components/AddFundsModal'
import { AddInvestmentModal } from '../components/AddInvestmentModal'
import { SellInvestmentModal } from '../components/SellInvestmentModal'
import { formatEUR } from '../lib/finance'
import {
  RISK_META,
  TYPE_META,
  elapsedFraction,
  formatDuration,
  futureValue,
  projectedGain,
} from '../lib/invest'
import { useApp } from '../context/AppContext'
import type { Investment } from '../types'

export function Invest() {
  const { account, investments } = useApp()
  const [fundsOpen, setFundsOpen] = useState(false)
  const [investOpen, setInvestOpen] = useState(false)
  const [sellTarget, setSellTarget] = useState<Investment | null>(null)

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Investir</h1>

      {/* Carte portefeuille */}
      <div className="relative overflow-hidden rounded-4xl brand-gradient p-6 text-white shadow-soft">
        <div className="absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm font-medium text-white/80">
            <TrendingUp size={16} /> Total investi
          </div>
          <div className="mt-2 text-4xl font-extrabold tracking-tight">{formatEUR(totalInvested)}</div>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-white/75">
            <Wallet size={14} /> Cash à investir : {formatEUR(account.investCash)}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setFundsOpen(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white/20 px-4 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/30"
            >
              <Plus size={16} /> Ajouter des fonds
            </button>
            <button
              onClick={() => setInvestOpen(true)}
              disabled={account.investCash <= 0}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-brand-700 shadow-sm transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <TrendingUp size={16} /> Investir
            </button>
          </div>
        </div>
      </div>

      {/* Investissements en cours */}
      <div>
        <h2 className="mb-2 px-1 text-sm font-bold text-slate-600">Investissements en cours</h2>
        <div className="space-y-3">
          {investments.map((inv) => (
            <InvestmentCard key={inv.id} inv={inv} onSell={() => setSellTarget(inv)} />
          ))}
          {investments.length === 0 && (
            <Card className="py-8 text-center text-sm text-slate-400">
              Aucun investissement. Ajoute des fonds puis investis-les.
            </Card>
          )}
        </div>
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-slate-400">
        Ceci est une démonstration. Les rendements affichés sont indicatifs et ne constituent pas un
        conseil en investissement.
      </p>

      {fundsOpen && <AddFundsModal onClose={() => setFundsOpen(false)} />}
      {investOpen && <AddInvestmentModal onClose={() => setInvestOpen(false)} />}
      {sellTarget && <SellInvestmentModal inv={sellTarget} onClose={() => setSellTarget(null)} />}
    </div>
  )
}

function InvestmentCard({ inv, onSell }: { inv: Investment; onSell: () => void }) {
  const fv = futureValue(inv)
  const gain = projectedGain(inv)
  const progress = elapsedFraction(inv)
  const risk = RISK_META[inv.risk]
  const type = TYPE_META[inv.type]

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
            {type.emoji}
          </span>
          <div>
            <div className="text-sm font-bold text-slate-800">{inv.productName}</div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${risk.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${risk.dot}`} /> {risk.label}
              </span>
              <span className="text-[11px] text-slate-400">{type.label}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-800">{formatEUR(inv.amount)}</div>
          <div className="text-[11px] text-slate-400">investis</div>
        </div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full brand-gradient transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-slate-400">
        <span>Durée {formatDuration(inv.months)}</span>
        <span>{Math.round(progress * 100)} % écoulé</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Valeur projetée : <strong>{formatEUR(fv)}</strong>{' '}
          <span className="text-emerald-600">(+{formatEUR(gain)})</span>
        </div>
        <button
          onClick={onSell}
          className="shrink-0 rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
        >
          Revendre
        </button>
      </div>
    </Card>
  )
}
