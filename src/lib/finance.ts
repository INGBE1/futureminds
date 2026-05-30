import type { Account, Goal, PurchaseAdvice, PurchaseInput } from '../types'

const eur = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
})

export function formatEUR(amount: number): string {
  return eur.format(amount)
}

export function goalProgress(goal: Goal): number {
  if (goal.target <= 0) return 0
  return Math.min(1, goal.saved / goal.target)
}

export function goalCompleted(goal: Goal): boolean {
  return goal.saved >= goal.target
}

/** Nombre de mois restants jusqu'à la date limite (au moins 1). */
export function monthsUntil(deadline: string): number {
  const now = new Date()
  const end = new Date(deadline)
  const months =
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  return Math.max(1, months)
}

/**
 * Épargne mensuelle requise pour atteindre un objectif.
 * Avec date limite : réparti sur les mois restants.
 * Sans date limite : horizon par défaut (court = 6 mois, long = 24 mois).
 */
export function monthlyForGoal(goal: Goal): number {
  const remaining = Math.max(0, goal.target - goal.saved)
  if (remaining === 0) return 0
  const months = goal.deadline
    ? monthsUntil(goal.deadline)
    : goal.horizon === 'short'
      ? 6
      : 24
  return Math.ceil(remaining / months)
}

/** Objectif prioritaire = le plus proche d'être atteint mais non terminé. */
export function priorityGoal(goals: Goal[]): Goal | null {
  const open = goals.filter((g) => g.saved < g.target)
  if (open.length === 0) return null
  return open.slice().sort((a, b) => goalProgress(b) - goalProgress(a))[0]
}

/**
 * Estime de combien de jours un achat retarde l'objectif prioritaire.
 * Hypothèse : l'argent dépensé aurait pu être épargné vers l'objectif.
 */
export function estimateGoalDelayDays(amount: number, account: Account): number {
  if (amount <= 0 || account.monthlySavings <= 0) return 0
  const dailySavings = account.monthlySavings / 30
  return Math.round(amount / dailySavings)
}

export function formatDelay(days: number): string {
  if (days <= 0) return 'aucun retard'
  if (days < 14) return `${days} jour${days > 1 ? 's' : ''}`
  const weeks = Math.round(days / 7)
  if (days < 60) return `~${weeks} semaines`
  const months = Math.round(days / 30)
  return `~${months} mois`
}

/**
 * Conseil d'achat calculé localement (sans IA).
 * Sert de repli si la clé API est absente ou si l'appel échoue.
 */
export function localAdvice(input: PurchaseInput, account: Account, goal: Goal | null): PurchaseAdvice {
  const { amount } = input
  const goalDelayDays = estimateGoalDelayDays(amount, account)
  const shareOfBalance = account.balance > 0 ? amount / account.balance : 1
  const pct = Math.round(shareOfBalance * 100)

  // Signaux factuels tirés de la raison invoquée (sans jugement de valeur).
  const looksEssential = /répar|essentiel|santé|médic|travail|boulot|école|étud|nécessa|urgen|sécur|indispensable/i.test(
    input.reason,
  )
  const looksImpulse = /envie|impulsion|soldes|promo|tendance|hype|coup de c|ennui/i.test(input.reason)

  const pros: string[] = []
  const cons: string[] = []

  // --- POUR (faits qui jouent en faveur de l'achat) ---
  if (looksEssential)
    pros.push("La raison indiquée correspond à un besoin (réparation, santé, travail…).")
  if (shareOfBalance <= 0.05)
    pros.push(`Faible poids budgétaire : ${pct} % de ton solde actuel.`)
  if (goalDelayDays > 0 && goalDelayDays <= 5)
    pros.push(`Impact limité sur ton objectif : ${formatDelay(goalDelayDays)} de retard seulement.`)
  else if (goalDelayDays === 0)
    pros.push("Aucun retard mesurable sur ton objectif d'épargne.")
  if (amount <= account.balance && shareOfBalance <= 0.15)
    pros.push('Ton solde couvre cet achat tout en gardant une marge confortable.')

  // --- CONTRE (faits qui appellent à la prudence) ---
  if (shareOfBalance >= 0.2) cons.push(`Poids élevé : ${pct} % de ton solde y passerait.`)
  if (amount > account.balance)
    cons.push('Le montant dépasse ton solde actuel.')
  if (goal && goalDelayDays > 5)
    cons.push(`Ton objectif « ${goal.name} » reculerait de ${formatDelay(goalDelayDays)}.`)
  if (looksImpulse)
    cons.push("La motivation décrite évoque plutôt une envie ponctuelle qu'un besoin.")

  // Garantir au moins un point de chaque côté, formulé neutrement.
  if (pros.length === 0)
    pros.push(
      `Achat assumé : ${pct} % de ton solde, ${
        goalDelayDays > 0 ? `${formatDelay(goalDelayDays)} de retard sur ton objectif` : 'sans retard notable'
      }.`,
    )
  if (cons.length === 0)
    cons.push("Vérifie que le besoin est réel et que le moment est le bon.")

  let verdict: PurchaseAdvice['verdict'] = 'confirm'
  if (shareOfBalance > 0.35 || amount > account.balance) verdict = 'avoid'
  else if (shareOfBalance > 0.15 || goalDelayDays > 20) verdict = 'reconsider'
  // Un besoin essentiel et abordable ne devrait pas être découragé sans raison.
  if (looksEssential && shareOfBalance <= 0.25 && amount <= account.balance && verdict === 'reconsider')
    verdict = 'confirm'

  const alternative =
    amount >= 60
      ? {
          name: `${input.item} — version plus abordable`,
          price: Math.round(amount * 0.6 * 100) / 100,
          why: `Environ 40 % moins cher : le retard sur ton objectif passerait à ${formatDelay(
            estimateGoalDelayDays(Math.round(amount * 0.6 * 100) / 100, account),
          )}.`,
        }
      : null

  return {
    summary:
      verdict === 'avoid'
        ? `Cet achat représente ${pct} % de ton solde et retarde ton objectif de ${formatDelay(goalDelayDays)}.`
        : verdict === 'reconsider'
          ? `Achat possible : ${pct} % de ton solde, ${formatDelay(goalDelayDays)} de retard sur ton objectif.`
          : `Achat soutenable : ${pct} % de ton solde, impact ${
              goalDelayDays > 0 ? `de ${formatDelay(goalDelayDays)}` : 'négligeable'
            } sur ton objectif.`,
    pros,
    cons,
    verdict,
    goalDelayDays,
    alternative,
    source: 'local',
  }
}
