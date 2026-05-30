import { Leaf, ShieldCheck, TrendingUp } from 'lucide-react'
import { Card } from '../components/Card'
import { formatEUR } from '../lib/finance'
import { useApp } from '../context/AppContext'

const ideas = [
  {
    Icon: ShieldCheck,
    name: 'Épargne sécurisée',
    risk: 'Risque faible',
    rate: '~3 % / an',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    Icon: TrendingUp,
    name: 'ETF Monde',
    risk: 'Risque modéré',
    rate: '~6 % / an',
    color: 'text-brand-600 bg-brand-50',
  },
  {
    Icon: Leaf,
    name: 'Fonds durables',
    risk: 'Risque modéré',
    rate: '~5 % / an',
    color: 'text-teal-600 bg-teal-50',
  },
]

export function Invest() {
  const { account } = useApp()
  const investable = Math.max(0, account.balance - 1000)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Investir</h1>

      <Card>
        <div className="text-sm font-medium text-slate-500">Disponible à investir</div>
        <div className="mt-1 text-3xl font-extrabold text-slate-800">{formatEUR(investable)}</div>
        <p className="mt-1 text-xs text-slate-400">
          Estimation après avoir gardé {formatEUR(1000)} de réserve de sécurité.
        </p>
      </Card>

      <div className="space-y-3">
        {ideas.map(({ Icon, name, risk, rate, color }) => (
          <Card key={name} className="flex items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${color}`}>
              <Icon size={22} />
            </span>
            <div className="flex-1">
              <div className="text-sm font-bold text-slate-800">{name}</div>
              <div className="text-xs text-slate-400">{risk}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800">{rate}</div>
              <div className="text-[11px] text-slate-400">rendement estimé</div>
            </div>
          </Card>
        ))}
      </div>

      <p className="px-1 text-center text-[11px] leading-relaxed text-slate-400">
        Ceci est une démonstration. Les rendements affichés sont indicatifs et ne constituent pas un
        conseil en investissement.
      </p>
    </div>
  )
}
