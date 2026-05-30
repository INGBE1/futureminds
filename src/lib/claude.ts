import Anthropic from '@anthropic-ai/sdk'
import type {
  Account,
  AdviceVerdict,
  ClaudeModel,
  Goal,
  PurchaseAdvice,
  PurchaseInput,
  Settings,
  SpendingProfile,
} from '../types'
import { estimateGoalDelayDays, formatDelay, formatEUR, localAdvice } from './finance'
import { localProfile, PERIOD_LABEL, type SpendingSummary } from './spending'

function makeClient(apiKey: string): Anthropic {
  // Application 100 % côté navigateur : la clé est fournie par l'utilisateur et
  // stockée dans son navigateur. dangerouslyAllowBrowser ajoute aussi l'en-tête
  // anthropic-dangerous-direct-browser-access requis pour l'accès direct.
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
}

const SYSTEM_PROMPT = `Tu es un conseiller financier neutre et impartial dans l'application Intent. \
Tu n'es ni vendeur ni moralisateur : tu aides l'utilisateur à décider en toute lucidité, \
sans le pousser à acheter ni le culpabiliser.

Quand l'utilisateur envisage un achat, tu reçois : l'article, la raison, le destinataire, \
le montant, son solde, son objectif d'épargne prioritaire et le retard estimé que l'achat \
provoquerait sur cet objectif.

Principes pour des arguments HONNÊTES et IMPARTIAUX :
- Chaque argument (pour comme contre) doit s'appuyer sur un FAIT concret : part du montant \
dans le solde (%), retard chiffré sur l'objectif, caractère essentiel/récurrent, \
durabilité ou qualité, coût d'opportunité, urgence réelle.
- Reconnais ouvertement quand un achat est LÉGITIME (besoin réel, réparation, santé, \
travail, études, bon rapport qualité/prix, sécurité) — ne décourage pas par défaut.
- Signale honnêtement les vrais risques (impulsion, faible nécessité, part élevée du \
budget) sans dramatiser ni juger la personne.
- Bannis les arguments creux, vagues ou purement persuasifs ("ça fait plaisir", \
"tu le mérites", "c'est tendance"). Reste factuel et équilibré des deux côtés.

Tu dois répondre UNIQUEMENT en appelant l'outil submit_advice avec :
- un résumé d'1 phrase : un CONSTAT neutre et chiffré, pas une injonction ;
- 2 à 3 arguments POUR, factuels ;
- 2 à 3 arguments CONTRE, factuels ;
- un verdict : "confirm" (raisonnable au vu des données), "reconsider" (à peser) ou \
"avoid" (clairement risqué pour le budget) — fondé sur les chiffres, pas sur un a priori ;
- une alternative seulement si elle est RÉELLEMENT pertinente et comparable (nom + prix \
approximatif en euros + pourquoi, factuel) ; sinon null. N'invente jamais un produit douteux.

Écris en français, ton sobre et respectueux.`

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

const PROFILE_SYSTEM_PROMPT = `Tu es un analyste financier neutre dans l'application Intent. \
À partir d'un résumé chiffré des dépenses d'un utilisateur sur une période, tu le classes \
dans une catégorie d'habitudes de dépense et tu expliques brièvement pourquoi.

Règles :
- Sois factuel et bienveillant, jamais culpabilisant.
- La catégorie est une étiquette courte et parlante (ex. « Épargnant prudent », \
« Dépensier impulsif », « Équilibré », « Gestionnaire avisé »).
- L'explication fait 1 à 2 phrases, s'appuie sur les chiffres fournis (% utile / à éviter / neutre).
- Choisis un emoji unique qui illustre la catégorie.

Réponds UNIQUEMENT en appelant l'outil submit_profile.`

const PROFILE_TOOL: Anthropic.Tool = {
  name: 'submit_profile',
  description: "Renvoie le profil de dépense structuré.",
  input_schema: {
    type: 'object',
    properties: {
      category: { type: 'string', description: 'Étiquette courte du profil.' },
      emoji: { type: 'string', description: 'Un seul emoji illustrant le profil.' },
      explanation: { type: 'string', description: 'Explication factuelle (1–2 phrases).' },
    },
    required: ['category', 'emoji', 'explanation'],
  },
}

interface ProfileToolResult {
  category: string
  emoji: string
  explanation: string
}

/**
 * Classe l'utilisateur dans une catégorie de dépense. Repli local si pas de clé/erreur.
 */
export async function getSpendingProfile(
  summary: SpendingSummary,
  settings: Settings,
): Promise<SpendingProfile> {
  if (!settings.apiKey || summary.count === 0) {
    return localProfile(summary)
  }

  try {
    const client = makeClient(settings.apiKey)
    const userPrompt = `Résumé des dépenses sur la période « ${PERIOD_LABEL[summary.period]} » :
- Total dépensé : ${formatEUR(summary.total)} sur ${summary.count} transactions
- Dépenses utiles : ${formatEUR(summary.useful)} (${summary.usefulPct} %)
- Dépenses à éviter : ${formatEUR(summary.avoid)} (${summary.avoidPct} %)
- Dépenses neutres : ${formatEUR(summary.neutral)} (${summary.neutralPct} %)

Classe l'utilisateur via l'outil submit_profile.`

    const response = await client.messages.create({
      model: settings.model,
      max_tokens: 512,
      system: [{ type: 'text', text: PROFILE_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: [PROFILE_TOOL],
      tool_choice: { type: 'tool', name: 'submit_profile' },
      messages: [{ role: 'user', content: userPrompt }],
    })

    const toolUse = response.content.find((b) => b.type === 'tool_use')
    if (!toolUse || toolUse.type !== 'tool_use') return localProfile(summary)

    const data = toolUse.input as ProfileToolResult
    return {
      category: data.category,
      emoji: data.emoji,
      explanation: data.explanation,
      source: 'ai',
    }
  } catch (err) {
    console.warn('Profil Claude échoué, repli local :', err)
    return localProfile(summary)
  }
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
