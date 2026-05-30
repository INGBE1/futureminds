import type { Account, Goal, Transaction, TransactionCategory, Usefulness } from '../types'

export const initialAccount: Account = {
  holder: 'Alex',
  balance: 2840.5,
  monthlySavings: 320,
}

export const initialGoals: Goal[] = [
  { id: 'g1', name: 'Voyage au Japon', emoji: '🗾', target: 3500, saved: 1450, horizon: 'long', deadline: inMonths(14) },
  { id: 'g2', name: "Fonds d'urgence", emoji: '🛟', target: 5000, saved: 2100, horizon: 'long' },
  { id: 'g3', name: 'Nouveau vélo', emoji: '🚲', target: 900, saved: 240, horizon: 'short', deadline: inMonths(5) },
]

function inMonths(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setMonth(d.getMonth() + n)
  return d.toISOString()
}

/** Modèle de dépense récurrent utilisé pour générer ~12 mois d'historique. */
interface Template {
  label: string
  recipient: string
  reason: string
  category: TransactionCategory
  amount: number // dépense positive (sera stockée en négatif)
  usefulness: Usefulness
  /** Cadence en jours entre deux occurrences. */
  everyDays: number
  /** Variation pseudo-aléatoire déterministe (± fraction du montant). */
  jitter: number
}

const TEMPLATES: Template[] = [
  { label: 'Loyer', recipient: 'Résidence Lumière', reason: 'Logement', category: 'bills', amount: 720, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Courses', recipient: 'Carrefour', reason: 'Alimentation', category: 'food', amount: 62, usefulness: 'useful', everyDays: 6, jitter: 0.3 },
  { label: 'Abonnement transport', recipient: 'STIB', reason: 'Trajets quotidiens', category: 'transport', amount: 49, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Électricité & gaz', recipient: 'Engie', reason: 'Énergie', category: 'bills', amount: 95, usefulness: 'useful', everyDays: 30, jitter: 0.15 },
  { label: 'Internet & mobile', recipient: 'Proximus', reason: 'Forfait', category: 'bills', amount: 45, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Pharmacie', recipient: 'Pharmacie du Parc', reason: 'Santé', category: 'other', amount: 24, usefulness: 'useful', everyDays: 38, jitter: 0.4 },
  { label: 'Restaurant', recipient: 'Le Petit Bistro', reason: 'Loisir', category: 'leisure', amount: 38, usefulness: 'avoid', everyDays: 11, jitter: 0.4 },
  { label: 'Streaming', recipient: 'Netflix', reason: 'Divertissement', category: 'leisure', amount: 14, usefulness: 'neutral', everyDays: 30, jitter: 0 },
  { label: 'Café à emporter', recipient: 'Starbucks', reason: 'Envie', category: 'leisure', amount: 6, usefulness: 'avoid', everyDays: 5, jitter: 0.3 },
  { label: 'Vêtements', recipient: 'Zara', reason: 'Shopping', category: 'shopping', amount: 58, usefulness: 'avoid', everyDays: 24, jitter: 0.5 },
  { label: 'Gadget high-tech', recipient: 'MediaMarkt', reason: 'Coup de cœur', category: 'shopping', amount: 95, usefulness: 'avoid', everyDays: 70, jitter: 0.6 },
  { label: 'Sortie cinéma', recipient: 'Kinepolis', reason: 'Loisir', category: 'leisure', amount: 13, usefulness: 'neutral', everyDays: 21, jitter: 0.3 },
  { label: 'Virement épargne', recipient: 'Objectif Japon', reason: 'Cotisation mensuelle', category: 'savings', amount: 200, usefulness: 'useful', everyDays: 30, jitter: 0 },
]

const HORIZON_DAYS = 365

/**
 * Génère un historique déterministe de ~1 an : revenus mensuels + dépenses récurrentes
 * issues des modèles ci-dessus. Aucun Math.random (rendu stable entre les recharges).
 */
function generateTransactions(): Transaction[] {
  const txs: Transaction[] = []

  // Salaire mensuel (crédit) — un par mois sur l'horizon.
  for (let m = 0; m * 30 <= HORIZON_DAYS; m++) {
    txs.push({
      id: `sal-${m}`,
      label: 'Salaire',
      recipient: 'Employeur',
      reason: 'Revenu mensuel',
      amount: 2200,
      category: 'other',
      date: isoDaysAgo(m * 30 + 2),
    })
  }

  // Dépenses récurrentes.
  TEMPLATES.forEach((t, ti) => {
    let occ = 0
    for (let d = 1; d <= HORIZON_DAYS; d += t.everyDays) {
      // Jitter déterministe basé sur les index (onde sinusoïdale normalisée 0..1).
      const wave = (Math.sin(ti * 7.13 + occ * 2.39) + 1) / 2
      const factor = 1 + (wave - 0.5) * 2 * t.jitter
      const amount = Math.round(t.amount * factor * 100) / 100
      txs.push({
        id: `t-${ti}-${occ}`,
        label: t.label,
        recipient: t.recipient,
        reason: t.reason,
        amount: -amount,
        category: t.category,
        date: isoDaysAgo(d),
        usefulness: t.usefulness,
      })
      occ++
    }
  })

  // Tri du plus récent au plus ancien.
  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const initialTransactions: Transaction[] = generateTransactions()
