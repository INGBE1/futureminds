import { useId, useState } from 'react'
import type { BalancePoint } from '../lib/spending'
import { formatEUR } from '../lib/finance'

interface Props {
  data: BalancePoint[]
}

const W = 320
const H = 150
const PAD_X = 8
const PAD_TOP = 14
const PAD_BOTTOM = 22

const tooltipDateFmt = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/** Courbe SVG de l'évolution du solde, avec tooltip au survol. Aucune dépendance. */
export function BalanceChart({ data }: Props) {
  const gradId = useId()
  const [hover, setHover] = useState<number | null>(null)

  if (data.length === 0) {
    return (
      <div className="flex h-[150px] items-center justify-center text-sm text-slate-400">
        Pas de données de solde sur cette période.
      </div>
    )
  }

  const values = data.map((d) => d.balance)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  // Marge de 8 % pour ne pas coller la courbe aux bords (et éviter min===max).
  const span = rawMax - rawMin || Math.max(1, Math.abs(rawMax))
  const min = rawMin - span * 0.08
  const max = rawMax + span * 0.08

  const n = data.length
  const innerW = W - PAD_X * 2
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const x = (i: number) => (n === 1 ? W / 2 : PAD_X + (i / (n - 1)) * innerW)
  const y = (v: number) => PAD_TOP + innerH - ((v - min) / (max - min)) * innerH

  const points = data.map((d, i) => [x(i), y(d.balance)] as const)
  const linePath = smoothPath(points)
  const areaPath = `${linePath} L ${x(n - 1)} ${PAD_TOP + innerH} L ${x(0)} ${PAD_TOP + innerH} Z`

  const labelIdx = n <= 3 ? data.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1]

  const last = data[data.length - 1]

  function handleMove(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    // Point le plus proche en X.
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < n; i++) {
      const d = Math.abs(x(i) - px)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    }
    setHover(best)
  }

  const hovered = hover != null ? data[hover] : null
  const hoveredX = hover != null ? x(hover) : 0
  const hoveredY = hover != null ? y(data[hover].balance) : 0

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-400">Solde actuel</div>
      <div className="mb-3 text-3xl font-extrabold tracking-tight text-slate-800">
        {formatEUR(last.balance)}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          role="img"
          onMouseMove={handleMove}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6200" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ff6200" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${gradId})`} />
          <path
            d={linePath}
            fill="none"
            stroke="#ff6200"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={n > 24 ? 0 : 2.2} fill="#ff6200" />
          ))}

          {labelIdx.map((i) => (
            <text
              key={i}
              x={x(i)}
              y={H - 6}
              textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'}
              className="fill-slate-400"
              fontSize="9"
            >
              {data[i].label}
            </text>
          ))}

          {/* Repère de survol */}
          {hover != null && (
            <g>
              <line
                x1={hoveredX}
                y1={PAD_TOP}
                x2={hoveredX}
                y2={PAD_TOP + innerH}
                stroke="#cbd5e1"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle cx={hoveredX} cy={hoveredY} r={4} fill="#ff6200" stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>

        {/* Bulle tooltip (HTML, positionnée en %) */}
        {hovered && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-xl bg-slate-800 px-2.5 py-1.5 text-center text-white shadow-soft"
            style={{
              left: `${(hoveredX / W) * 100}%`,
              top: `${(hoveredY / H) * 100}%`,
              marginTop: '-6px',
            }}
          >
            <div className="whitespace-nowrap text-[10px] text-slate-300">
              {tooltipDateFmt.format(new Date(hovered.date))}
            </div>
            <div className="whitespace-nowrap text-xs font-bold">{formatEUR(hovered.balance)}</div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Génère un chemin SVG lissé passant par tous les points. */
function smoothPath(pts: readonly (readonly [number, number])[]): string {
  if (pts.length === 1) {
    const [px, py] = pts[0]
    return `M ${px} ${py} L ${px} ${py}`
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] ?? p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`
  }
  return d
}
