import { useEffect, useState } from 'react'
import { Loader2, Sparkles, X } from 'lucide-react'
import type { PurchaseAdvice, PurchaseInput } from '../types'
import { useApp, priorityGoal } from '../context/AppContext'
import { getPurchaseAdvice } from '../lib/claude'
import { AdviceView } from './AdviceView'

type Step = 'form' | 'loading' | 'advice'

const empty: PurchaseInput = { item: '', reason: '', recipient: '', amount: 0 }

export function PayModal({ onClose }: { onClose: () => void }) {
  const { account, goals, settings, confirmPurchase, hasApiKey, setActiveTab } = useApp()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState<PurchaseInput>(empty)
  const [amountStr, setAmountStr] = useState('')
  const [advice, setAdvice] = useState<PurchaseAdvice | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const amount = parseFloat(amountStr.replace(',', '.')) || 0
  const canSubmit = form.item.trim() !== '' && amount > 0

  async function handleSubmit() {
    if (!canSubmit) return
    const input: PurchaseInput = { ...form, amount }
    setForm(input)
    setStep('loading')
    const result = await getPurchaseAdvice(input, account, priorityGoal(goals), settings)
    setAdvice(result)
    setStep('advice')
  }

  function handleConfirm() {
    confirmPurchase({ ...form, amount })
    onClose()
  }

  function handlePickAlternative(name: string, price: number) {
    confirmPurchase({ ...form, item: name, amount: price })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-4xl bg-white p-5 shadow-soft no-scrollbar sm:rounded-4xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-extrabold">
            <Sparkles size={18} className="text-brand-600" />
            {step === 'advice' ? 'Avant de payer…' : 'Nouveau paiement'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'form' && (
          <div className="space-y-3">
            {!hasApiKey && (
              <button
                onClick={() => {
                  onClose()
                  setActiveTab('settings')
                }}
                className="w-full rounded-2xl bg-amber-50 px-4 py-2.5 text-left text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                💡 Aucune clé API Claude — conseil calculé localement. Touchez pour en ajouter une.
              </button>
            )}

            <Field
              label="Qu'achetez-vous ?"
              value={form.item}
              onChange={(v) => setForm((f) => ({ ...f, item: v }))}
              placeholder="ex. Casque audio"
            />
            <Field
              label="Pourquoi ?"
              value={form.reason}
              onChange={(v) => setForm((f) => ({ ...f, reason: v }))}
              placeholder="ex. Pour le travail / par envie"
            />
            <Field
              label="À qui ?"
              value={form.recipient}
              onChange={(v) => setForm((f) => ({ ...f, recipient: v }))}
              placeholder="ex. Amazon, un ami…"
            />
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Montant (€)</label>
              <input
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-bold outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="mt-1 w-full rounded-2xl brand-gradient px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Analyser cet achat
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-slate-500">
            <Loader2 size={28} className="animate-spin text-brand-600" />
            <p className="text-sm font-medium">Analyse de ton achat…</p>
          </div>
        )}

        {step === 'advice' && advice && (
          <AdviceView
            advice={advice}
            amount={amount}
            onConfirm={handleConfirm}
            onCancel={onClose}
            onPickAlternative={handlePickAlternative}
          />
        )}
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100"
      />
    </div>
  )
}
