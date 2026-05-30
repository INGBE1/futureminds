import { useApp } from '../context/AppContext'
import { Card } from '../components/Card'
import { formatEUR, goalProgress } from '../lib/finance'

export function Goals() {
  const { goals, account } = useApp()
  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Objectifs</h1>

      <Card className="brand-gradient text-white">
        <div className="text-sm font-medium text-white/80">Total épargné</div>
        <div className="mt-1 text-3xl font-extrabold">{formatEUR(totalSaved)}</div>
        <div className="mt-1 text-sm text-white/75">
          sur {formatEUR(totalTarget)} d'objectifs · {formatEUR(account.monthlySavings)}/mois
        </div>
      </Card>

      <div className="space-y-3">
        {goals.map((g) => {
          const p = goalProgress(g)
          const remaining = Math.max(0, g.target - g.saved)
          return (
            <Card key={g.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                    {g.emoji}
                  </span>
                  <div>
                    <div className="text-sm font-bold">{g.name}</div>
                    <div className="text-xs text-slate-500">
                      {formatEUR(g.saved)} / {formatEUR(g.target)}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-bold text-brand-600">{Math.round(p * 100)} %</span>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full brand-gradient transition-all"
                  style={{ width: `${p * 100}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-400">
                {remaining > 0 ? `Encore ${formatEUR(remaining)} à épargner` : 'Objectif atteint ! 🎉'}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
