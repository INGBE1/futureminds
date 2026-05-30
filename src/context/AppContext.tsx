import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type {
  Account,
  ClaudeModel,
  Goal,
  PurchaseInput,
  Settings,
  Tab,
  Transaction,
  TransactionCategory,
  Usefulness,
} from '../types'
import { initialAccount, initialGoals, initialTransactions } from '../data/mockData'
import { loadJSON, saveJSON, loadString, saveString, removeKey } from '../lib/storage'
import { priorityGoal } from '../lib/finance'

// Bump quand les données mock changent de forme : force le rechargement des seeds.
const DATA_VERSION = '3'

interface AppState {
  account: Account
  transactions: Transaction[]
  goals: Goal[]
  settings: Settings
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  setApiKey: (key: string) => void
  setModel: (model: ClaudeModel) => void
  hasApiKey: boolean
  /** Débite le compte, crée une transaction et fait progresser l'objectif prioritaire. */
  confirmPurchase: (
    input: PurchaseInput,
    opts?: { category?: TransactionCategory; usefulness?: Usefulness },
  ) => void
  /** Crée un nouvel objectif d'épargne. */
  addGoal: (goal: Omit<Goal, 'id' | 'saved'>) => void
  /** Ajoute de l'argent à un objectif : débite le solde + crée une transaction d'épargne. */
  addToGoal: (goalId: string, amount: number) => void
}

const AppContext = createContext<AppState | null>(null)

function genId(): string {
  return 't' + Math.abs(hashString(JSON.stringify(Date.now()) + Math.floor(performance.now())))
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return h
}

export function AppProvider({ children }: { children: ReactNode }) {
  // Si la version des données a changé, on repart des seeds (sans toucher clé/modèle).
  const fresh = loadString('dataVersion') !== DATA_VERSION
  if (fresh) saveString('dataVersion', DATA_VERSION)

  const [account, setAccount] = useState<Account>(() =>
    fresh ? initialAccount : loadJSON('account', initialAccount),
  )
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    fresh ? initialTransactions : loadJSON('transactions', initialTransactions),
  )
  const [goals, setGoals] = useState<Goal[]>(() =>
    fresh ? initialGoals : loadJSON('goals', initialGoals),
  )
  const [apiKey, setApiKeyState] = useState<string>(() => loadString('apiKey'))
  const [model, setModelState] = useState<ClaudeModel>(
    () => (loadString('model') as ClaudeModel) || 'claude-sonnet-4-6',
  )
  const [activeTab, setActiveTab] = useState<Tab>('home')

  useEffect(() => saveJSON('account', account), [account])
  useEffect(() => saveJSON('transactions', transactions), [transactions])
  useEffect(() => saveJSON('goals', goals), [goals])
  useEffect(() => saveString('model', model), [model])

  function setApiKey(key: string) {
    const trimmed = key.trim()
    setApiKeyState(trimmed)
    if (trimmed) saveString('apiKey', trimmed)
    else removeKey('apiKey')
  }

  function setModel(m: ClaudeModel) {
    setModelState(m)
  }

  function confirmPurchase(
    input: PurchaseInput,
    opts: { category?: TransactionCategory; usefulness?: Usefulness } = {},
  ) {
    const tx: Transaction = {
      id: genId(),
      label: input.item || 'Achat',
      recipient: input.recipient || '—',
      reason: input.reason || '—',
      amount: -Math.abs(input.amount),
      category: opts.category ?? 'shopping',
      date: new Date().toISOString(),
      usefulness: opts.usefulness,
    }
    setTransactions((prev) => [tx, ...prev])
    setAccount((prev) => ({ ...prev, balance: Math.round((prev.balance - Math.abs(input.amount)) * 100) / 100 }))
  }

  function addGoal(goal: Omit<Goal, 'id' | 'saved'>) {
    const newGoal: Goal = { ...goal, id: 'g' + genId(), saved: 0 }
    setGoals((prev) => [...prev, newGoal])
  }

  function addToGoal(goalId: string, amount: number) {
    const amt = Math.abs(amount)
    if (amt <= 0) return
    const goal = goals.find((g) => g.id === goalId)
    setGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, saved: Math.round((g.saved + amt) * 100) / 100 } : g)),
    )
    setAccount((prev) => ({
      ...prev,
      balance: Math.round((prev.balance - amt) * 100) / 100,
    }))
    setTransactions((prev) => [
      {
        id: genId(),
        label: `Épargne · ${goal?.name ?? 'Objectif'}`,
        recipient: goal?.name ?? 'Objectif',
        reason: "Versement vers l'objectif",
        amount: -amt,
        category: 'savings',
        date: new Date().toISOString(),
        usefulness: 'useful',
      },
      ...prev,
    ])
  }

  const value = useMemo<AppState>(
    () => ({
      account,
      transactions,
      goals,
      settings: { apiKey, model },
      activeTab,
      setActiveTab,
      setApiKey,
      setModel,
      hasApiKey: apiKey.length > 0,
      confirmPurchase,
      addGoal,
      addToGoal,
    }),
    [account, transactions, goals, apiKey, model, activeTab],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp(): AppState {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp doit être utilisé dans un <AppProvider>')
  return ctx
}

// eslint-disable-next-line react-refresh/only-export-components
export { priorityGoal }
