import type { Investment, Product, ProductType, RiskLevel } from '../types'

/** Catalogue local de produits par niveau de risque (taux croissants avec le risque). */
export const PRODUCT_CATALOG: Product[] = [
  // --- Risque faible ---
  { id: 'p-low-1', name: 'Obligations d’État', type: 'etf', risk: 'low', annualRate: 0.025, description: 'ETF obligataire souverain, faible volatilité.' },
  { id: 'p-low-2', name: 'Fonds Climat Durable', type: 'sustainable', risk: 'low', annualRate: 0.035, description: 'Fonds vert prudent, entreprises à faible empreinte.' },
  { id: 'p-low-3', name: 'ETF Marché Monétaire', type: 'etf', risk: 'low', annualRate: 0.03, description: 'Liquidités rémunérées, risque minimal.' },
  // --- Risque modéré ---
  { id: 'p-mod-1', name: 'ETF MSCI World', type: 'etf', risk: 'moderate', annualRate: 0.06, description: 'Actions mondiales diversifiées, équilibre rendement/risque.' },
  { id: 'p-mod-2', name: 'Fonds ISR Europe', type: 'sustainable', risk: 'moderate', annualRate: 0.055, description: 'Investissement socialement responsable, sociétés européennes.' },
  { id: 'p-mod-3', name: 'Action Air Liquide', type: 'stock', risk: 'moderate', annualRate: 0.065, description: 'Valeur défensive stable versant un dividende régulier.' },
  // --- Risque haut ---
  { id: 'p-high-1', name: 'ETF Nasdaq 100', type: 'etf', risk: 'high', annualRate: 0.1, description: 'Technologie US, fort potentiel mais volatil.' },
  { id: 'p-high-2', name: 'Action Tesla', type: 'stock', risk: 'high', annualRate: 0.12, description: 'Valeur de croissance très volatile.' },
  { id: 'p-high-3', name: 'Fonds Transition Énergie', type: 'sustainable', risk: 'high', annualRate: 0.09, description: 'Énergies renouvelables émergentes, croissance et risque élevés.' },
]

export function productsForRisk(risk: RiskLevel): Product[] {
  return PRODUCT_CATALOG.filter((p) => p.risk === risk)
}

/** Valeur projetée à l'échéance : montant × (1 + taux)^(mois/12). */
export function futureValue(inv: Pick<Investment, 'amount' | 'annualRate' | 'months'>): number {
  const v = inv.amount * Math.pow(1 + inv.annualRate, inv.months / 12)
  return Math.round(v * 100) / 100
}

export function projectedGain(inv: Investment): number {
  return Math.round((futureValue(inv) - inv.amount) * 100) / 100
}

/** Fraction du temps écoulé depuis le début (0..1), capée à l'échéance. */
export function elapsedFraction(inv: Investment): number {
  const start = new Date(inv.startDate).getTime()
  const now = Date.now()
  const totalMs = inv.months * 30 * 86_400_000
  if (totalMs <= 0) return 1
  return Math.min(1, Math.max(0, (now - start) / totalMs))
}

/** Valeur actuelle au prorata du temps écoulé (pour la revente). */
export function currentValue(inv: Investment): number {
  const years = (elapsedFraction(inv) * inv.months) / 12
  const v = inv.amount * Math.pow(1 + inv.annualRate, years)
  return Math.round(v * 100) / 100
}

export const RISK_META: Record<RiskLevel, { label: string; chip: string; dot: string }> = {
  low: { label: 'Faible', chip: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  moderate: { label: 'Modéré', chip: 'bg-brand-50 text-brand-700', dot: 'bg-brand-500' },
  high: { label: 'Haut', chip: 'bg-rose-50 text-rose-700', dot: 'bg-rose-400' },
}

export const TYPE_META: Record<ProductType, { label: string; emoji: string }> = {
  etf: { label: 'ETF', emoji: '📊' },
  stock: { label: 'Action', emoji: '📈' },
  sustainable: { label: 'Fonds durable', emoji: '🌱' },
}

export const DURATIONS = [6, 12, 36, 60] as const

export function formatDuration(months: number): string {
  if (months < 12) return `${months} mois`
  const y = months / 12
  return `${y} an${y > 1 ? 's' : ''}`
}
