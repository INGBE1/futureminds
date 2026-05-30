import type { Account, Goal, Transaction } from '../types'

export const initialAccount: Account = {
  holder: 'Alex',
  balance: 2840.5,
  monthlySavings: 320,
}

export const initialGoals: Goal[] = [
  { id: 'g1', name: 'Voyage au Japon', emoji: '🗾', target: 3500, saved: 1450 },
  { id: 'g2', name: "Fonds d'urgence", emoji: '🛟', target: 5000, saved: 2100 },
  { id: 'g3', name: 'Nouveau vélo', emoji: '🚲', target: 900, saved: 240 },
]

export const initialTransactions: Transaction[] = [
  {
    id: 't1',
    label: 'Courses de la semaine',
    recipient: 'Carrefour',
    reason: 'Alimentation',
    amount: -68.4,
    category: 'food',
    date: daysAgo(1),
  },
  {
    id: 't2',
    label: 'Abonnement transport',
    recipient: 'STIB',
    reason: 'Trajets quotidiens',
    amount: -49,
    category: 'transport',
    date: daysAgo(3),
  },
  {
    id: 't3',
    label: 'Virement épargne',
    recipient: 'Objectif Japon',
    reason: 'Cotisation mensuelle',
    amount: -200,
    category: 'savings',
    date: daysAgo(5),
  },
  {
    id: 't4',
    label: 'Salaire',
    recipient: 'Employeur',
    reason: 'Revenu mensuel',
    amount: 2200,
    category: 'other',
    date: daysAgo(6),
  },
  {
    id: 't5',
    label: 'Restaurant entre amis',
    recipient: 'Le Petit Bistro',
    reason: 'Loisir',
    amount: -34.5,
    category: 'leisure',
    date: daysAgo(8),
  },
]

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
