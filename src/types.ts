export type Tab = 'home' | 'transactions' | 'goals' | 'invest' | 'settings'

export interface Account {
  holder: string
  balance: number // en euros
  monthlySavings: number // épargne mensuelle estimée (€/mois)
  investCash: number // cash disponible à investir (€)
}

export type TransactionCategory =
  | 'food'
  | 'shopping'
  | 'transport'
  | 'leisure'
  | 'bills'
  | 'savings'
  | 'other'

/** Utilité d'une dépense pour le code couleur et le profil. */
export type Usefulness = 'useful' | 'avoid' | 'neutral'

export interface Transaction {
  id: string
  label: string // ce qui a été acheté
  recipient: string // à qui
  reason: string // pourquoi
  amount: number // négatif = débit, positif = crédit
  category: TransactionCategory
  date: string // ISO
  usefulness?: Usefulness // si absent, dérivé de la catégorie
  affectsBalance?: boolean // false = transfert interne (n'impacte pas le solde du compte)
}

export type SpendingPeriod = 'week' | 'month' | 'year' | 'all'

export interface SpendingProfile {
  category: string // ex. « Épargnant prudent »
  emoji: string
  explanation: string // 1–2 phrases factuelles
  source: 'ai' | 'local'
}

export type GoalHorizon = 'short' | 'long'

export interface Goal {
  id: string
  name: string
  emoji: string
  target: number // montant cible (€)
  saved: number // déjà épargné (€)
  horizon: GoalHorizon // court ou long terme
  deadline?: string // date limite ISO (optionnelle)
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

export type RiskLevel = 'low' | 'moderate' | 'high'
export type ProductType = 'etf' | 'stock' | 'sustainable'

export interface Product {
  id: string
  name: string
  type: ProductType
  risk: RiskLevel
  annualRate: number // taux annuel estimé (ex. 0.06 = 6 %/an)
  description: string
}

export interface Investment {
  id: string
  productName: string
  type: ProductType
  risk: RiskLevel
  amount: number // capital investi (€)
  annualRate: number
  months: number // durée choisie
  startDate: string // ISO
}

export type ClaudeModel = 'claude-sonnet-4-6' | 'claude-opus-4-8'

export interface Settings {
  apiKey: string
  model: ClaudeModel
}
