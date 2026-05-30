export type Tab = 'home' | 'transactions' | 'goals' | 'invest' | 'settings'

export interface Account {
  holder: string
  balance: number // en euros
  monthlySavings: number // épargne mensuelle estimée (€/mois)
}

export type TransactionCategory =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'leisure'
  | 'bills'
  | 'savings'
  | 'other'

export interface Transaction {
  id: string
  label: string // ce qui a été acheté
  recipient: string // à qui
  reason: string // pourquoi
  amount: number // négatif = débit, positif = crédit
  category: TransactionCategory
  date: string // ISO
}

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number // montant cible (€)
  saved: number // déjà épargné (€)
}

/** Recommandation renvoyée par l'assistant d'achat. */
export type AdviceVerdict = 'confirm' | 'reconsider' | 'avoid'

export interface PurchaseAdvice {
  summary: string
  pros: string[]
  cons: string[]
  verdict: AdviceVerdict
  goalDelayDays: number // de combien de jours l'objectif prioritaire est retardé
  alternative: {
    name: string
    price: number
    why: string
  } | null
  source: 'ai' | 'local' // d'où vient le conseil (IA Claude ou règles locales)
}

/** Données saisies par l'utilisateur dans la fenêtre de paiement. */
export interface PurchaseInput {
  item: string
  reason: string
  recipient: string
  amount: number
}

export type ClaudeModel = 'claude-sonnet-4-6' | 'claude-opus-4-8'

export interface Settings {
  apiKey: string
  model: ClaudeModel
}
