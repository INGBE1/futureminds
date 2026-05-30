import Anthropic from '@anthropic-ai/sdk'
import type {
  Account,
  AdviceVerdict,
  ClaudeModel,
  Goal,
  PurchaseAdvice,
  PurchaseInput,
  Settings,
} from '../types'
import { estimateGoalDelayDays, formatDelay, formatEUR, localAdvice } from './finance'

function makeClient(apiKey: string): Anthropic {
  // Application 100 % côté navigateur : la clé est fournie par l'utilisateur et
  // stockée dans son navigateur. dangerouslyAllowBrowser ajoute aussi l'en-tête
  // anthropic-dangerous-direct-browser-access requis pour l'accès direct.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const SYSTEM_PROMPT = `Tu es le coach financier de l'application FutureMinds. Ton rôle est d'aider \
l'utilisateur à dépenser en conscience et à cotiser vers ses objectifs.

Quand l'utilisateur envisage un achat, tu reçois : l'article, la raison, le destinataire, \
le montant, son solde, son objectif d'épargne prioritaire et le retard estimé que l'achat \
provoquerait sur cet objectif.

Tu dois répondre UNIQUEMENT en appelant l'outil submit_advice avec :
- un court résumé (1 phrase, ton bienveillant et direct, en français) ;
- 2 à 3 arguments POUR l'achat ;
- 2 à 3 arguments CONTRE l'achat ;
- un verdict : "confirm" (raisonnable), "reconsider" (à réfléchir) ou "avoid" (à éviter) ;
- une alternative similaire moins chère et concrète (nom + prix approximatif en euros + pourquoi), \
ou null si aucune alternative pertinente.

Sois honnête, concret et concis. Ne juge jamais durement l'utilisateur ; encourage des choix sains.`

const ADVICE_TOOL: Anthropic.Tool = {
  name: 'submit_advice',
  description: "Renvoie le conseil d'achat structuré.",
  input_schema: {
    type: 'object',
    properties: {
      summary: { type: 'string', description: 'Résumé en une phrase, en français.' },
      pros: { type: 'array', items: { type: 'string' }, description: "Arguments pour l'achat." },
      cons: { type: 'array', items: { type: 'string' }, description: "Arguments contre l'achat." },
      verdict: {
        type: 'string',
        enum: ['confirm', 'reconsider', 'avoid'],
        description: 'Recommandation globale.',
      },
      alternative: {
        type: ['object', 'null'],
        description: 'Article similaire moins cher, ou null.',
        properties: {
          name: { type: 'string' },
          price: { type: 'number' },
          why: { type: 'string' },
        },
        required: ['name', 'price', 'why'],
      },
    },
    required: ['summary', 'pros', 'cons', 'verdict'],
  },
}

interface ToolResult {
  summary: string
  pros: string[]
  cons: string[]
  verdict: AdviceVerdict
  alternative: { name: string; price: number; why: string } | null
}

/**
 * Demande un conseil d'achat à Claude. En cas d'absence de clé ou d'erreur,
 * renvoie un conseil calculé localement (jamais d'exception non gérée côté UI).
 */
export async function getPurchaseAdvice(
  input: PurchaseInput,
  account: Account,
  goal: Goal | null,
  settings: Settings,
): Promise<PurchaseAdvice> {
  const goalDelayDays = estimateGoalDelayDays(input.amount, account)

  if (!settings.apiKey) {
    return localAdvice(input, account, goal)
  }

  try {
    const client = makeClient(settings.apiKey)
    const userPrompt = buildUserPrompt(input, account, goal, goalDelayDays)

    const response = await client.messages.create({
      model: settings.model,
      max_tokens: 1024,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [ADVICE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_advice' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') {
      return localAdvice(input, account, goal)
    }

    const data = toolUse.input as ToolResult
    return {
      summary: data.summary,
      pros: Array.isArray(data.pros) ? data.pros : [],
      cons: Array.isArray(data.cons) ? data.cons : [],
      verdict: data.verdict ?? 'reconsider',
      goalDelayDays, // calculé localement pour rester cohérent avec les Objectifs
      alternative: data.alternative ?? null,
      source: 'ai',
    }
  } catch (err) {
    console.warn('Appel Claude échoué, repli sur le conseil local :', err)
    return localAdvice(input, account, goal)
  }
}

function buildUserPrompt(
  input: PurchaseInput,
  account: Account,
  goal: Goal | null,
  goalDelayDays: number,
): string {
  const goalLine = goal
    ? `Objectif prioritaire : « ${goal.name} » (${formatEUR(goal.saved)} épargnés sur ${formatEUR(
        goal.target,
      )}). Cet achat le retarderait d'environ ${formatDelay(goalDelayDays)}.`
    : "L'utilisateur n'a pas d'objectif d'épargne en cours."

  return `Achat envisagé :
- Article : ${input.item}
- Raison : ${input.reason}
- Destinataire : ${input.recipient}
- Montant : ${formatEUR(input.amount)}

Situation financière :
- Solde actuel : ${formatEUR(account.balance)}
- Épargne mensuelle estimée : ${formatEUR(account.monthlySavings)}
- ${goalLine}

Donne ton conseil via l'outil submit_advice.`
}

/** Vérifie qu'une clé API fonctionne (petit appel de test). */
export async function testConnection(
  apiKey: string,
  model: ClaudeModel,
): Promise<{ ok: boolean; message: string }> {
  try {
    const client = makeClient(apiKey)
    await client.messages.create({
      model,
      max_tokens: 8,
      messages: [{ role: 'user', content: 'Réponds simplement par "ok".' }],
    })
    return { ok: true, message: 'Connexion réussie ✅' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: `Échec : ${msg}` }
  }
}
