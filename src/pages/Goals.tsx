import { useState } from 'react'
import { CheckCircle2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Card } from '../components/Card'
import { AddGoalModal } from '../components/AddGoalModal'
import { AddMoneyModal } from '../components/AddMoneyModal'
import { formatEUR, goalCompleted, goalProgress, monthlyForGoal } from '../lib/finance'
import type { Goal, GoalHorizon } from '../types'

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

export function Goals() {
  const { goals, account } = useApp()
  const [addOpen, setAddOpen] = useState(false)
  const [moneyGoal, setMoneyGoal] = useState<Goal | null>(null)

  const totalSaved = goals.reduce((s, g) => s + g.saved, 0)
  const totalTarget = goals.reduce((s, g) => s + g.target, 0)

  const shortTerm = goals.filter((g) => g.horizon === 'short')
  const longTerm = goals.filter((g) => g.horizon === 'long')

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Objectifs</h1>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-2xl brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      <Card className="brand-gradient text-white">
        <div className="text-sm font-medium text-white/80">Total épargné</div>
        <div className="mt-1 text-3xl font-extrabold">{formatEUR(totalSaved)}</div>
        <div className="mt-1 text-sm text-white/75">
          sur {formatEUR(totalTarget)} d'objectifs · solde {formatEUR(account.balance)}
        </div>
      </Card>

      <GoalSection
        title="Court terme"
        horizon="short"
        goals={shortTerm}
        onAddMoney={setMoneyGoal}
      />
      <GoalSection title="Long terme" horizon="long" goals={longTerm} onAddMoney={setMoneyGoal} />

      {goals.length === 0 && (
        <Card className="py-10 text-center text-sm text-slate-400">
          Aucun objectif pour l'instant. Touche « Ajouter » pour commencer.
        </Card>
      )}

      {addOpen && <AddGoalModal onClose={() => setAddOpen(false)} />}
      {moneyGoal && <AddMoneyModal goal={moneyGoal} onClose={() => setMoneyGoal(null)} />}
    </div>
  )
}

function GoalSection({
  title,
  goals,
  onAddMoney,
}: {
  title: string
  horizon: GoalHorizon
  goals: Goal[]
  onAddMoney: (g: Goal) => void
}) {
  if (goals.length === 0) return null
  return (
    <div>
      <h2 className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h2>
      <div className="space-y-3">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onAddMoney={onAddMoney} />
        ))}
      </div>
    </div>
  )
}

function GoalCard({ goal, onAddMoney }: { goal: Goal; onAddMoney: (g: Goal) => void }) {
  const p = goalProgress(goal)
  const done = goalCompleted(goal)
  const remaining = Math.max(0, goal.target - goal.saved)
  const monthly = monthlyForGoal(goal)

  return (
    <Card className={done ? 'ring-2 ring-emerald-300' : ''}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-2xl text-2xl ${
              done ? 'bg-emerald-50' : 'bg-slate-50'
            }`}
          >
            {goal.emoji}
          </span>
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold">
              {goal.name}
              {done && <CheckCircle2 size={15} className="text-emerald-500" />}
            </div>
            <div className="text-xs text-slate-500">
              {formatEUR(goal.saved)} / {formatEUR(goal.target)}
            </div>
          </div>
        </div>
        <span className={`text-sm font-bold ${done ? 'text-emerald-600' : 'text-brand-600'}`}>
          {Math.round(p * 100)} %
        </span>
      </div>

      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : 'brand-gradient'}`}
          style={{ width: `${p * 100}%` }}
        />
      </div>

      {done ? (
        <div className="mt-2 text-xs font-semibold text-emerald-600">Objectif atteint ! 🎉</div>
      ) : (
        <>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Encore {formatEUR(remaining)}</span>
            <span>
              {formatEUR(monthly)}/mois
              {goal.deadline ? ` · avant le ${dateFmt.format(new Date(goal.deadline))}` : ''}
            </span>
          </div>
          <button
            onClick={() => onAddMoney(goal)}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <Plus size={15} /> Ajouter de l'argent
          </button>
        </>
      )}
    </Card>
  )
}
