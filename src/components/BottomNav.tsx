import { Home, ReceiptText, Target, TrendingUp } from 'lucide-react'
import type { Tab } from '../types'
import { useApp } from '../context/AppContext'

const items: { tab: Tab; label: string; Icon: typeof Home }[] = [
  { tab: 'home', label: 'Accueil', Icon: Home },
  { tab: 'transactions', label: 'Transactions', Icon: ReceiptText },
  { tab: 'goals', label: 'Objectifs', Icon: Target },
  { tab: 'invest', label: 'Investir', Icon: TrendingUp },
]

export function BottomNav() {
  const { activeTab, setActiveTab } = useApp()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-100 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {items.map(({ tab, label, Icon }) => {
          const active = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-current={active ? 'page' : undefined}
              className="group relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 transition"
            >
              <span
                className={`flex h-9 w-12 items-center justify-center rounded-full transition ${
                  active ? 'brand-gradient text-white shadow-soft' : 'text-slate-400'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              </span>
              <span
                className={`text-[11px] font-semibold transition ${
                  active ? 'text-brand-600' : 'text-slate-400'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
