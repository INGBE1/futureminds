import type {
  SpendingPeriod,
  SpendingProfile,
  Transaction,
  TransactionCategory,
  Usefulness,
} from '../types'

/** Utilité par défaut dérivée de la catégorie si la transaction n'en porte pas. */
const CATEGORY_USEFULNESS: Record<TransactionCategory, Usefulness> = {
  bills: 'useful',
  transport: 'useful',
  savings: 'neutral',
  food: 'useful',
  leisure: 'avoid',
  shopping: 'avoid',
  other: 'neutral',
}

export function usefulnessOf(tx: Transaction): Usefulness {
  return tx.usefulness ?? CATEGORY_USEFULNESS[tx.category]
}

/** Une dépense = montant négatif (on exclut revenus/crédits). */
export function isExpense(tx: Transaction): boolean {
  return tx.amount < 0
}

export function periodStart(period: SpendingPeriod): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  switch (period) {
    case 'week':
      d.setDate(d.getDate() - 6)
      break
    case 'month':
      d.setDate(d.getDate() - 29)
      break
    case 'year':
      d.setDate(d.getDate() - 364)
      break
    case 'all':
      return new Date(0)
  }
  return d
}

export const PERIOD_LABEL: Record<SpendingPeriod, string> = {
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
  all: 'Tout',
}

/** Transactions de la période (toutes, dépenses et revenus). */
export function inPeriod(transactions: Transaction[], period: SpendingPeriod): Transaction[] {
  const start = periodStart(period).getTime()
  return transactions.filter((t) => new Date(t.date).getTime() >= start)
}

export interface SeriesPoint {
  label: string
  total: number
}

/**
 * Agrège les dépenses de la période en points pour la courbe.
 * - semaine/mois : un point par jour
 * - année/all : un point par mois
 */
export function buildSeries(transactions: Transaction[], period: SpendingPeriod): SeriesPoint[] {
  const expenses = inPeriod(transactions, period).filter(isExpense)
  const byMonth = period === 'year' || period === 'all'

  const buckets = new Map<string, { label: string; total: number; sortKey: number }>()

  for (const tx of expenses) {
    const date = new Date(tx.date)
    let key: string
    let label: string
    let sortKey: number
    if (byMonth) {
      key = `${date.getFullYear()}-${date.getMonth()}`
      label = date.toLocaleDateString('fr-FR', { month: 'short' })
      sortKey = date.getFullYear() * 12 + date.getMonth()
    } else {
      key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      label = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
      sortKey = Math.floor(date.getTime() / 86_400_000)
    }
    const cur = buckets.get(key) ?? { label, total: 0, sortKey }
    cur.total += Math.abs(tx.amount)
    buckets.set(key, cur)
  }

  return [...buckets.values()]
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ label, total }) => ({ label, total: Math.round(total * 100) / 100 }))
}

export interface BalancePoint {
  label: string
  balance: number
  date: string // ISO du bucket (pour le tooltip)
}

const SAMPLE_COUNT: Record<SpendingPeriod, number> = {
  week: 7,
  month: 15,
  year: 13,
  all: 13,
}

/**
 * Reconstruit l'évolution du solde sur la période, en remontant depuis le solde actuel.
 * Ignore les transferts internes (affectsBalance === false).
 *
 * Échantillonne le solde à intervalles RÉGULIERS sur toute la fenêtre (et pas seulement
 * là où il existe une transaction) : la courbe est donc toujours remplie, même sur les
 * longues périodes (Année / Tout).
 */
export function buildBalanceSeries(
  transactions: Transaction[],
  currentBalance: number,
  period: SpendingPeriod,
): BalancePoint[] {
  const affecting = transactions
    .filter((t) => t.affectsBalance !== false)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Solde de départ = solde actuel moins la somme de toutes les transactions.
  const sum = affecting.reduce((s, t) => s + t.amount, 0)
  const startBalance = Math.round((currentBalance - sum) * 100) / 100

  // Suite cumulée : solde APRÈS chaque transaction, avec son horodatage.
  const cumulative: { time: number; balance: number }[] = []
  let running = startBalance
  for (const tx of affecting) {
    running = Math.round((running + tx.amount) * 100) / 100
    cumulative.push({ time: new Date(tx.date).getTime(), balance: running })
  }

  const now = Date.now()
  const firstTime = affecting.length ? new Date(affecting[0].date).getTime() : now
  const from = period === 'all' ? firstTime : Math.max(periodStart(period).getTime(), firstTime)
  const to = now
  const byMonth = period === 'year' || period === 'all'

  /** Dernier solde connu à la date donnée (sinon solde de départ). */
  const balanceAt = (time: number): number => {
    let bal = startBalance
    for (const c of cumulative) {
      if (c.time <= time) bal = c.balance
      else break
    }
    return bal
  }

  const fmt = (time: number): string =>
    new Date(time).toLocaleDateString('fr-FR', byMonth ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' })

  const n = SAMPLE_COUNT[period]
  const span = Math.max(1, to - from)
  const points: BalancePoint[] = []
  for (let i = 0; i < n; i++) {
    const t = i === n - 1 ? to : from + (span * i) / (n - 1)
    points.push({
      label: fmt(t),
      balance: i === n - 1 ? currentBalance : balanceAt(t),
      date: new Date(t).toISOString(),
    })
  }
  return points
}

export interface SpendingSummary {
  period: SpendingPeriod
  total: number
  useful: number
  avoid: number
  neutral: number
  usefulPct: number
  avoidPct: number
  neutralPct: number
  count: number
}

export function summarize(transactions: Transaction[], period: SpendingPeriod): SpendingSummary {
  const expenses = inPeriod(transactions, period).filter(isExpense)
  let useful = 0
  let avoid = 0
  let neutral = 0
  for (const tx of expenses) {
    const amt = Math.abs(tx.amount)
    const u = usefulnessOf(tx)
    if (u === 'useful') useful += amt
    else if (u === 'avoid') avoid += amt
    else neutral += amt
  }
  const total = useful + avoid + neutral
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0)
  return {
    period,
    total: Math.round(total * 100) / 100,
    useful: Math.round(useful * 100) / 100,
    avoid: Math.round(avoid * 100) / 100,
    neutral: Math.round(neutral * 100) / 100,
    usefulPct: pct(useful),
    avoidPct: pct(avoid),
    neutralPct: pct(neutral),
    count: expenses.length,
  }
}

/** Couleurs ING/sémantiques pour le code couleur des transactions. */
export const usefulnessStyle: Record<Usefulness, { ring: string; bg: string; dot: string; label: string }> = {
  useful: { ring: 'ring-emerald-200', bg: 'bg-emerald-50', dot: 'bg-emerald-500', label: 'Utile' },
  avoid: { ring: 'ring-rose-200', bg: 'bg-rose-50', dot: 'bg-rose-400', label: 'À éviter' },
  neutral: { ring: 'ring-slate-200', bg: 'bg-white', dot: 'bg-slate-300', label: 'Neutre' },
}

/**
 * Profil de dépense calculé localement à partir des ratios par utilité.
 * Sert de base et de repli si l'IA n'est pas disponible.
 */
export function localProfile(s: SpendingSummary): SpendingProfile {
  if (s.count === 0 || s.total === 0) {
    return {
      category: 'Pas encore de données',
      emoji: '🫧',
      explanation: 'Aucune dépense sur cette période — impossible de dégager un profil pour le moment.',
      source: 'local',
    }
  }

  let category: string
  let emoji: string
  if (s.avoidPct >= 45) {
    category = 'Dépensier impulsif'
    emoji = '🛍️'
  } else if (s.usefulPct >= 65) {
    category = 'Épargnant prudent'
    emoji = '🛟'
  } else if (s.avoidPct <= 20 && s.usefulPct >= 50) {
    category = 'Gestionnaire avisé'
    emoji = '🧭'
  } else {
    category = 'Équilibré'
    emoji = '⚖️'
  }

  const explanation =
    `Sur cette période, ${s.usefulPct} % de tes dépenses sont utiles, ` +
    `${s.avoidPct} % sont à éviter et ${s.neutralPct} % sont neutres. ` +
    (s.avoidPct >= 45
      ? 'Une part importante part dans des achats évitables.'
      : s.usefulPct >= 65
        ? 'Tes dépenses servent surtout l’essentiel et l’épargne.'
        : 'Tu gardes un équilibre raisonnable entre besoins et envies.')

  return { category, emoji, explanation, source: 'local' }
}
