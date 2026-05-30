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

  const pros: string[] = []
  const cons: string[] = []

  if (amount < 30) pros.push('Petit montant : impact limité sur ton budget.')
  if (shareOfBalance < 0.05) pros.push('Représente une faible part de ton solde actuel.')
  if (/répar|essentiel|santé|travail|école|nécessa/i.test(input.reason))
    pros.push('La raison invoquée semble être un besoin essentiel.')
  if (pros.length === 0) pros.push('Un achat réfléchi peut faire plaisir et rester raisonnable.')

  if (shareOfBalance > 0.2)
    cons.push(`Cet achat représente ${Math.round(shareOfBalance * 100)} % de ton solde.`)
  if (goal) cons.push(`Ton objectif « ${goal.name} » sera retardé de ${formatDelay(goalDelayDays)}.`)
  if (/envie|impulsion|soldes|promo|tendance/i.test(input.reason))
    cons.push('La motivation ressemble à un achat impulsif.')
  if (cons.length === 0) cons.push('Vérifie que tu en as réellement besoin maintenant.')

  let verdict: PurchaseAdvice['verdict'] = 'confirm'
  if (shareOfBalance > 0.35 || amount > account.balance) verdict = 'avoid'
  else if (shareOfBalance > 0.15 || goalDelayDays > 20) verdict = 'reconsider'

  const alternative =
    amount >= 60
      ? {
          name: `${input.item} — option plus abordable`,
          price: Math.round(amount * 0.6 * 100) / 100,
          why: 'Une alternative ~40 % moins chère limiterait le retard sur ton objectif.',
        }
      : null

  return {
    summary:
      verdict === 'avoid'
        ? 'Cet achat pèse lourd sur ton budget — mieux vaut attendre.'
        : verdict === 'reconsider'
          ? 'Achat possible, mais il vaut la peine d’y réfléchir à deux fois.'
          : 'Cet achat semble raisonnable au vu de ton budget.',
    pros,
    cons,
    verdict,
    goalDelayDays,
    alternative,
    source: 'local',
  }
}
