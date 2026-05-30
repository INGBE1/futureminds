import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { GoalHorizon } from '../types'
import { formatEUR, monthlyForGoal } from '../lib/finance'

const EMOJIS = ['🎯', '🏖️', '🏠', '🚗', '💻', '🎓', '🛟', '🚲', '🗾', '💍', '🎁', '📱']

export function AddGoalModal({ onClose }: { onClose: () => void }) {
  const { addGoal } = useApp()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🎯')
  const [targetStr, setTargetStr] = useState('')
  const [horizon, setHorizon] = useState<GoalHorizon>('short')
  const [deadline, setDeadline] = useState('') // yyyy-mm-dd ou ''
  const [horizonTouched, setHorizonTouched] = useState(false)

  const target = parseFloat(targetStr.replace(',', '.')) || 0
  const canSubmit = name.trim() !== '' && target > 0

  // Suggestion automatique du terme selon la date (override possible).
  function onDeadlineChange(value: string) {
    setDeadline(value)
    if (value && !horizonTouched) {
      const months =
        (new Date(value).getFullYear() - new Date().getFullYear()) * 12 +
        (new Date(value).getMonth() - new Date().getMonth())
      setHorizon(months > 12 ? 'long' : 'short')
    }
  }

  function handleSubmit() {
    if (!canSubmit) return
    addGoal({
      name: name.trim(),
      emoji,
      target: Math.round(target * 100) / 100,
      horizon,
      deadline: deadline ? new Date(deadline + 'T12:00:00').toISOString() : undefined,
    })
    onClose()
  }

  // Aperçu de l'épargne mensuelle requise.
  const preview =
    target > 0
      ? monthlyForGoal({
          id: 'preview',
          name,
          emoji,
          target: Math.round(target * 100) / 100,
          saved: 0,
          horizon,
          deadline: deadline ? new Date(deadline + 'T12:00:00').toISOString() : undefined,
        })
      : 0

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-white p-5 shadow-soft no-scrollbar sm:rounded-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Nouvel objectif</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Nom de l'objectif</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Voyage en Italie"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Emblème</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl text-xl transition ${
                    emoji === e ? 'bg-brand-50 ring-2 ring-brand-500' : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Somme totale (€)</label>
            <input
              inputMode="decimal"
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Terme</label>
            <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
              {(['short', 'long'] as GoalHorizon[]).map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setHorizon(h)
                    setHorizonTouched(true)
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                    horizon === h ? 'brand-gradient text-white shadow-soft' : 'text-slate-500'
                  }`}
                >
                  {h === 'short' ? 'Court terme' : 'Long terme'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">
              Date limite <span className="font-normal text-slate-400">(optionnel)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => onDeadlineChange(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>

          {preview > 0 && (
            <div className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
              <Sparkles size={16} />
              <span>
                Épargne suggérée : <strong>{formatEUR(preview)}/mois</strong>
                {!deadline && ` (horizon ${horizon === 'short' ? '6 mois' : '24 mois'})`}
              </span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Créer l'objectif
          </button>
        </div>
      </div>
    </div>
  )
}
