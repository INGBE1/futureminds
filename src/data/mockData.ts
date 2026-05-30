import type { Account, Goal, Investment, Transaction, TransactionCategory, Usefulness } from '../types'

// initialAccount est défini en bas du fichier (son solde est calculé à partir de
// l'historique généré, pour garantir une courbe de solde toujours positive).

export const initialInvestments: Investment[] = [
  {
    id: 'inv1',
    productName: 'ETF MSCI World',
    type: 'etf',
    risk: 'moderate',
    amount: 600,
    annualRate: 0.06,
    months: 36,
    startDate: monthsAgoIso(4),
  },
  {
    id: 'inv2',
    productName: 'Fonds Climat Durable',
    type: 'sustainable',
    risk: 'low',
    amount: 300,
    annualRate: 0.035,
    months: 24,
    startDate: monthsAgoIso(2),
  },
]

function monthsAgoIso(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setMonth(d.getMonth() - n)
  return d.toISOString()
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
  { label: 'Courses', recipient: 'Carrefour', reason: 'Alimentation', category: 'food', amount: 64, usefulness: 'useful', everyDays: 6, jitter: 0.35 },
  { label: 'Boulangerie', recipient: 'Le Fournil', reason: 'Alimentation', category: 'food', amount: 8, usefulness: 'useful', everyDays: 7, jitter: 0.3 },
  { label: 'Abonnement transport', recipient: 'STIB', reason: 'Trajets quotidiens', category: 'transport', amount: 49, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Essence', recipient: 'Total', reason: 'Carburant', category: 'transport', amount: 55, usefulness: 'useful', everyDays: 16, jitter: 0.35 },
  { label: 'Électricité & gaz', recipient: 'Engie', reason: 'Énergie', category: 'bills', amount: 95, usefulness: 'useful', everyDays: 30, jitter: 0.25 },
  { label: 'Internet & mobile', recipient: 'Proximus', reason: 'Forfait', category: 'bills', amount: 45, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Pharmacie', recipient: 'Pharmacie du Parc', reason: 'Santé', category: 'other', amount: 24, usefulness: 'useful', everyDays: 35, jitter: 0.4 },
  { label: 'Restaurant', recipient: 'Le Petit Bistro', reason: 'Loisir', category: 'leisure', amount: 40, usefulness: 'avoid', everyDays: 10, jitter: 0.45 },
  { label: 'Sortie bar', recipient: 'Delirium Café', reason: 'Sortie entre amis', category: 'leisure', amount: 26, usefulness: 'avoid', everyDays: 14, jitter: 0.5 },
  { label: 'Streaming', recipient: 'Netflix', reason: 'Divertissement', category: 'leisure', amount: 14, usefulness: 'neutral', everyDays: 30, jitter: 0 },
  { label: 'Musique', recipient: 'Spotify', reason: 'Abonnement', category: 'leisure', amount: 11, usefulness: 'neutral', everyDays: 30, jitter: 0 },
  { label: 'Stockage cloud', recipient: 'iCloud', reason: 'Abonnement', category: 'bills', amount: 3, usefulness: 'neutral', everyDays: 30, jitter: 0 },
  { label: 'Café à emporter', recipient: 'Starbucks', reason: 'Envie', category: 'leisure', amount: 5.5, usefulness: 'avoid', everyDays: 4, jitter: 0.35 },
  { label: 'Vêtements', recipient: 'Zara', reason: 'Shopping', category: 'shopping', amount: 56, usefulness: 'avoid', everyDays: 26, jitter: 0.55 },
  { label: 'Gadget high-tech', recipient: 'MediaMarkt', reason: 'Coup de cœur', category: 'shopping', amount: 90, usefulness: 'avoid', everyDays: 75, jitter: 0.6 },
  { label: 'Sortie cinéma', recipient: 'Kinepolis', reason: 'Loisir', category: 'leisure', amount: 13, usefulness: 'neutral', everyDays: 24, jitter: 0.3 },
  { label: 'Livres & jeux', recipient: 'Fnac', reason: 'Loisir', category: 'shopping', amount: 25, usefulness: 'neutral', everyDays: 40, jitter: 0.4 },
  { label: 'Don mensuel', recipient: 'Croix-Rouge', reason: 'Don', category: 'other', amount: 15, usefulness: 'useful', everyDays: 30, jitter: 0 },
  { label: 'Virement épargne', recipient: 'Objectif Japon', reason: 'Cotisation mensuelle', category: 'savings', amount: 200, usefulness: 'neutral', everyDays: 30, jitter: 0 },
]

const HORIZON_DAYS = 540

/** Transaction ponctuelle (exceptionnelle) à une date précise de l'historique. */
interface OneOff {
  daysAgo: number
  label: string
  recipient: string
  reason: string
  category: TransactionCategory
  amount: number // négatif = dépense, positif = crédit
  usefulness?: Usefulness
}

/** Événements ponctuels répartis sur ~18 mois pour rendre les vues longues plausibles. */
const ONE_OFFS: OneOff[] = [
  // --- Crédits exceptionnels (rebonds du solde) ---
  { daysAgo: 20, label: 'Remboursement santé', recipient: 'Mutualité', reason: 'Remboursement soins', category: 'other', amount: 84.3 },
  { daysAgo: 48, label: 'Cashback carte', recipient: 'Banque', reason: 'Programme fidélité', category: 'other', amount: 22 },
  { daysAgo: 72, label: 'Mission freelance', recipient: 'Client X', reason: 'Extra freelance', category: 'other', amount: 350 },
  { daysAgo: 95, label: 'Prime de fin d’année', recipient: 'Employeur', reason: 'Bonus annuel', category: 'other', amount: 1500 },
  { daysAgo: 140, label: 'Vente Vinted', recipient: 'Vinted', reason: 'Revente vêtements', category: 'other', amount: 46 },
  { daysAgo: 175, label: 'Remboursement ami', recipient: 'Léa', reason: 'Remboursement', category: 'other', amount: 60 },
  { daysAgo: 210, label: 'Mission freelance', recipient: 'Client Y', reason: 'Extra freelance', category: 'other', amount: 480 },
  { daysAgo: 250, label: 'Cadeau anniversaire', recipient: 'Famille', reason: 'Cadeau', category: 'other', amount: 200 },
  { daysAgo: 300, label: 'Vente console', recipient: '2ememain', reason: 'Revente occasion', category: 'other', amount: 180 },
  { daysAgo: 330, label: 'Remboursement impôts', recipient: 'SPF Finances', reason: 'Régularisation fiscale', category: 'other', amount: 420 },
  { daysAgo: 388, label: 'Mission freelance', recipient: 'Client Z', reason: 'Extra freelance', category: 'other', amount: 300 },
  { daysAgo: 455, label: 'Prime de fin d’année', recipient: 'Employeur', reason: 'Bonus annuel', category: 'other', amount: 1400 },
  { daysAgo: 470, label: 'Vente meuble', recipient: '2ememain', reason: 'Revente occasion', category: 'other', amount: 130 },
  { daysAgo: 515, label: 'Cashback énergie', recipient: 'Engie', reason: 'Régularisation', category: 'other', amount: 95 },

  // --- Dépenses exceptionnelles (creux du solde) ---
  { daysAgo: 8, label: 'Cadeau', recipient: 'Amazon', reason: 'Cadeau', category: 'shopping', amount: -42, usefulness: 'neutral' },
  { daysAgo: 12, label: 'Réparation vélo', recipient: 'Cyclofix', reason: 'Réparation', category: 'transport', amount: -78, usefulness: 'useful' },
  { daysAgo: 26, label: 'Vêtements d’hiver', recipient: 'Decathlon', reason: 'Shopping', category: 'shopping', amount: -130, usefulness: 'neutral' },
  { daysAgo: 38, label: 'Cadeau anniversaire', recipient: 'Ami', reason: 'Cadeau', category: 'shopping', amount: -55, usefulness: 'neutral' },
  { daysAgo: 52, label: 'Amende stationnement', recipient: 'Ville de Bruxelles', reason: 'Amende', category: 'other', amount: -45, usefulness: 'avoid' },
  { daysAgo: 60, label: 'Dentiste', recipient: 'Cabinet dentaire', reason: 'Santé', category: 'other', amount: -120, usefulness: 'useful' },
  { daysAgo: 75, label: 'Soldes mode', recipient: 'Zalando', reason: 'Shopping', category: 'shopping', amount: -160, usefulness: 'avoid' },
  { daysAgo: 88, label: 'Billets de concert', recipient: 'Ticketmaster', reason: 'Loisir', category: 'leisure', amount: -110, usefulness: 'avoid' },
  { daysAgo: 105, label: 'Réparation smartphone', recipient: 'iFix', reason: 'Réparation', category: 'other', amount: -89, usefulness: 'useful' },
  { daysAgo: 115, label: 'Week-end Amsterdam', recipient: 'Booking', reason: 'Voyage', category: 'leisure', amount: -240, usefulness: 'avoid' },
  { daysAgo: 132, label: 'Anniversaire restaurant', recipient: 'La Quincaillerie', reason: 'Sortie', category: 'leisure', amount: -135, usefulness: 'avoid' },
  { daysAgo: 150, label: 'Pneus hiver', recipient: 'Vroomly', reason: 'Entretien auto', category: 'transport', amount: -260, usefulness: 'useful' },
  { daysAgo: 165, label: 'Nouveau smartphone', recipient: 'Coolblue', reason: 'Remplacement', category: 'shopping', amount: -699, usefulness: 'neutral' },
  { daysAgo: 185, label: 'Cadeau de Noël', recipient: 'Famille', reason: 'Cadeaux', category: 'shopping', amount: -220, usefulness: 'neutral' },
  { daysAgo: 200, label: 'Assurance auto', recipient: 'AG Insurance', reason: 'Assurance annuelle', category: 'bills', amount: -310, usefulness: 'useful' },
  { daysAgo: 222, label: 'Soirée nouvel an', recipient: 'Event', reason: 'Loisir', category: 'leisure', amount: -150, usefulness: 'avoid' },
  { daysAgo: 240, label: 'Lunettes de vue', recipient: 'Optique Center', reason: 'Santé', category: 'other', amount: -185, usefulness: 'useful' },
  { daysAgo: 265, label: 'Stage photo', recipient: 'Atelier', reason: 'Loisir', category: 'leisure', amount: -120, usefulness: 'avoid' },
  { daysAgo: 290, label: 'Électroménager', recipient: 'MediaMarkt', reason: 'Lave-vaisselle', category: 'shopping', amount: -430, usefulness: 'neutral' },
  { daysAgo: 315, label: 'Médecin spécialiste', recipient: 'Clinique', reason: 'Santé', category: 'other', amount: -95, usefulness: 'useful' },
  { daysAgo: 345, label: 'Vol intérieur', recipient: 'Ryanair', reason: 'Voyage', category: 'leisure', amount: -180, usefulness: 'avoid' },
  { daysAgo: 360, label: 'Vacances d’été', recipient: 'TUI', reason: 'Voyage', category: 'leisure', amount: -880, usefulness: 'avoid' },
  { daysAgo: 385, label: 'Festival', recipient: 'Tomorrowland', reason: 'Loisir', category: 'leisure', amount: -210, usefulness: 'avoid' },
  { daysAgo: 410, label: 'Cours de cuisine', recipient: 'Atelier Gourmand', reason: 'Loisir', category: 'leisure', amount: -95, usefulness: 'avoid' },
  { daysAgo: 430, label: 'Vélo électrique', recipient: 'Decathlon', reason: 'Mobilité', category: 'transport', amount: -650, usefulness: 'useful' },
  { daysAgo: 450, label: 'Réparation voiture', recipient: 'Garage Central', reason: 'Réparation', category: 'transport', amount: -520, usefulness: 'useful' },
  { daysAgo: 480, label: 'Déménagement', recipient: 'Location utilitaire', reason: 'Déménagement', category: 'other', amount: -180, usefulness: 'useful' },
  { daysAgo: 500, label: 'Meuble salon', recipient: 'IKEA', reason: 'Ameublement', category: 'shopping', amount: -360, usefulness: 'neutral' },
  { daysAgo: 525, label: 'Abonnement salle de sport', recipient: 'Basic-Fit', reason: 'Santé', category: 'leisure', amount: -240, usefulness: 'useful' },
]

/**
 * Génère un historique déterministe de ~18 mois : revenus mensuels, dépenses récurrentes
 * issues des modèles, et événements ponctuels. Aucun Math.random (stable entre recharges).
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

  // Événements ponctuels.
  ONE_OFFS.forEach((o, oi) => {
    txs.push({
      id: `oneoff-${oi}`,
      label: o.label,
      recipient: o.recipient,
      reason: o.reason,
      amount: o.amount,
      category: o.category,
      date: isoDaysAgo(o.daysAgo),
      usefulness: o.usefulness,
    })
  })

  // Dépenses récurrentes, modulées par une "vague mensuelle" déterministe pour créer
  // des mois plus chers et d'autres plus économes (relief réaliste de la courbe).
  TEMPLATES.forEach((t, ti) => {
    let occ = 0
    for (let d = 1; d <= HORIZON_DAYS; d += t.everyDays) {
      // Jitter déterministe basé sur les index (onde sinusoïdale normalisée 0..1).
      const wave = (Math.sin(ti * 7.13 + occ * 2.39) + 1) / 2
      const jitterFactor = 1 + (wave - 0.5) * 2 * t.jitter
      const factor = jitterFactor * monthWave(Math.floor(d / 30))
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

/** Multiplicateur mensuel déterministe (~0.8 à ~1.2) : certains mois coûtent plus. */
function monthWave(monthIndex: number): number {
  return 1 + 0.2 * Math.sin(monthIndex * 1.7)
}

function isoDaysAgo(n: number): string {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

export const initialTransactions: Transaction[] = generateTransactions()

/**
 * Calcule un solde actuel cohérent : on reconstruit le solde cumulé (chronologique)
 * en partant de 0, puis on cale le point le plus bas sur un plancher positif. Le solde
 * "actuel" = plancher + variation nette totale. Garantit une courbe toujours > 0.
 */
function computeCurrentBalance(transactions: Transaction[], floor = 350): number {
  const chrono = transactions
    .filter((t) => t.affectsBalance !== false)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  let running = 0
  let min = 0
  let total = 0
  for (const t of chrono) {
    running += t.amount
    total += t.amount
    if (running < min) min = running
  }
  // startBalance tel que le minimum reconstruit = floor → current = start + total.
  const startBalance = floor - min
  return Math.round((startBalance + total) * 100) / 100
}

export const initialAccount: Account = {
  holder: 'Alex',
  balance: computeCurrentBalance(initialTransactions),
  monthlySavings: 320,
  investCash: 500,
}
