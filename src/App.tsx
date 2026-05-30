import { Settings as SettingsIcon } from 'lucide-react'
import { useApp } from './context/AppContext'
import { BottomNav } from './components/BottomNav'
import { Logo } from './components/Logo'
import { Home } from './pages/Home'
import { Transactions } from './pages/Transactions'
import { Goals } from './pages/Goals'
import { Invest } from './pages/Invest'
import { Settings } from './pages/Settings'

export default function App() {
  const { activeTab, setActiveTab, hasApiKey } = useApp()

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-slate-50/80 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center gap-2">
          <Logo size={36} />
          <span className="text-lg font-extrabold tracking-tight text-slate-800">Intent</span>
        </div>
        <button
          onClick={() => setActiveTab('settings')}
          aria-label="Réglages"
          className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 ${
            activeTab === 'settings' ? 'bg-slate-100 text-brand-600' : ''
          }`}
        >
          <SettingsIcon size={18} />
          {!hasApiKey && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-slate-50" />
          )}
        </button>
      </header>

      <main className="flex-1 px-5 pb-28 pt-1">
        {activeTab === 'home' && <Home />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'goals' && <Goals />}
        {activeTab === 'invest' && <Invest />}
        {activeTab === 'settings' && <Settings />}
      </main>

      <BottomNav />
    </div>
  )
}
