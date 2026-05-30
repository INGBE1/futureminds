import { useEffect, useMemo, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/Card'
import { BalanceChart } from '../components/SpendingChart'
import { formatEUR } from '../lib/finance'
import {
  buildBalanceSeries,
  inPeriod,
  PERIOD_LABEL,
  summarize,
  usefulnessOf,
  usefulnessStyle,
} from '../lib/spending'
import { getSpendingProfile } from '../lib/claude'
import type { SpendingPeriod, SpendingProfile, TransactionCategory } from '../types'

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
const PERIODS: SpendingPeriod[] = ['week', 'month', 'year', 'all']

export function Transactions() {
  const { account, transactions, settings } = useApp()
  const [period, setPeriod] = useState<SpendingPeriod>('month')
  const [profile, setProfile] = useState<SpendingProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

  const balanceSeries = useMemo(
    () => buildBalanceSeries(transactions, account.balance, period),
    [transactions, account.balance, period],
  )
  const summary = useMemo(() => summarize(transactions, period), [transactions, period])
  // Historique complet : dépenses ET crédits (salaire, revente…).
  const visible = useMemo(() => inPeriod(transactions, period), [transactions, period])

  // Profil de dépense : local instantané, affiné par l'IA si une clé existe.
  useEffect(() => {
    let cancelled = false
    setLoadingProfile(true)
    getSpendingProfile(summary, settings).then((p) => {
      if (!cancelled) {
        setProfile(p)
        setLoadingProfile(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [summary, settings])

  const groups = visible.reduce<Record<string, typeof visible>>((acc, tx) => {
    const key = dateFmt.format(new Date(tx.date))
    ;(acc[key] ??= []).push(tx)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Transactions</h1>

      {/* Sélecteur de période */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {PERIODS.map((p) => {
          const active = period === p
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                active ? 'brand-gradient text-white shadow-soft' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          )
        })}
      </div>

      {/* Graphique d'évolution du solde */}
      <Card>
        <BalanceChart data={balanceSeries} />
      </Card>

      {/* Profil de dépense */}
      <Card>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Ton profil de dépense
          </span>
          {profile && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
              <Sparkles size={12} />
              {profile.source === 'ai' ? 'IA' : 'local'}
            </span>
          )}
        </div>
        {loadingProfile && !profile ? (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Analyse de tes habitudes…
          </div>
        ) : profile ? (
          <div className="flex items-start gap-3">
            <span className="text-3xl">{profile.emoji}</span>
            <div>
              <div className="text-base font-extrabold text-slate-800">{profile.category}</div>
              <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{profile.explanation}</p>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Légende couleurs */}
      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        {(['useful', 'neutral', 'avoid'] as const).map((u) => (
          <span key={u} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${usefulnessStyle[u].dot}`} />
            {usefulnessStyle[u].label}
          </span>
        ))}
      </div>

      {/* Liste colorée par utilité */}
      {Object.entries(groups).map(([day, txs]) => (
        <div key={day}>
          <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{day}</h2>
          <div className="space-y-2">
            {txs.map((tx) => {
              const isCredit = tx.amount >= 0
              // Crédits en vert ; dépenses colorées par utilité.
              const style = isCredit
                ? { bg: 'bg-emerald-50', ring: 'ring-emerald-200' }
                : usefulnessStyle[usefulnessOf(tx)]
              return (
                <div
                  key={tx.id}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 shadow-sm ring-1 ${style.bg} ${style.ring}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-lg">
                    {isCredit ? '💰' : categoryEmoji[tx.category]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">{tx.label}</div>
                    <div className="truncate text-xs text-slate-400">
                      {tx.recipient} · {tx.reason}
                    </div>
                  </div>
                  <div
                    className={`shrink-0 text-sm font-bold ${
                      isCredit ? 'text-emerald-600' : 'text-slate-800'
                    }`}
                  >
                    {isCredit ? '+' : ''}
                    {formatEUR(tx.amount)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {visible.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-400">
          Aucune transaction sur cette période.
        </Card>
      )}
    </div>
  )
}
