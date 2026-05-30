import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { useApp } from '../context/AppContext'
import { testConnection } from '../lib/claude'
import type { ClaudeModel } from '../types'

const MODELS: { id: ClaudeModel; label: string; hint: string }[] = [
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', hint: 'Rapide et économique (recommandé)' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8', hint: 'Le plus capable, plus lent' },
]

export function Settings() {
  const { settings, setApiKey, setModel, hasApiKey } = useApp()
  const [draft, setDraft] = useState(settings.apiKey)
  const [show, setShow] = useState(false)
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  function handleSave() {
    setApiKey(draft)
    setResult({ ok: true, message: 'Clé enregistrée dans ce navigateur.' })
  }

  function handleClear() {
    setDraft('')
    setApiKey('')
    setResult(null)
  }

  async function handleTest() {
    setTesting(true)
    setResult(null)
    setApiKey(draft) // on enregistre avant de tester
    const r = await testConnection(draft.trim(), settings.model)
    setResult(r)
    setTesting(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Réglages</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connecte ton assistant d'achat intelligent.
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <KeyRound size={18} />
          </span>
          <div>
            <h2 className="font-bold">Clé API Claude</h2>
            <p className="text-xs text-slate-500">Nécessaire pour les conseils générés par l'IA.</p>
          </div>
        </div>

        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="sk-ant-..."
            spellCheck={false}
            autoComplete="off"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Masquer la clé' : 'Afficher la clé'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" full onClick={handleSave} disabled={!draft.trim()}>
            Enregistrer
          </Button>
          <Button variant="secondary" onClick={handleTest} disabled={!draft.trim() || testing}>
            {testing ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
            Tester
          </Button>
          {hasApiKey && (
            <Button variant="danger" onClick={handleClear} aria-label="Effacer la clé">
              <Trash2 size={16} />
            </Button>
          )}
        </div>

        {result && (
          <p
            className={`rounded-xl px-3 py-2 text-xs font-medium ${
              result.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {result.message}
          </p>
        )}

        <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
          🔒 Ta clé reste <strong>dans ton navigateur</strong> (localStorage) et n'est envoyée qu'à
          l'API d'Anthropic. Sans clé, l'app utilise un conseil calculé localement.
        </p>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-bold">Modèle</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODELS.map((m) => {
            const active = settings.model === m.id
            return (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`rounded-2xl border p-3 text-left transition ${
                  active
                    ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-bold text-slate-800">{m.label}</div>
                <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{m.hint}</div>
              </button>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
