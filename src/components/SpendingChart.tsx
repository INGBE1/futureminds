import { useId } from 'react'
import type { SeriesPoint } from '../lib/spending'
import { formatEUR } from '../lib/finance'

interface Props {
  data: SeriesPoint[]
  total: number
}

const W = 320
const H = 140
const PAD_X = 8
const PAD_TOP = 14
const PAD_BOTTOM = 22

/** Courbe SVG maison des dépenses, aux couleurs ING. Aucune dépendance. */
export function SpendingChart({ data, total }: Props) {
  const gradId = useId()

  if (data.length === 0) {
    return (
      <div className="flex h-[140px] items-center justify-center text-sm text-slate-400">
        Aucune dépense sur cette période.
      </div>
    )
  }

  const max = Math.max(...data.map((d) => d.total), 1)
  const n = data.length
  const innerW = W - PAD_X * 2
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const x = (i: number) => (n === 1 ? W / 2 : PAD_X + (i / (n - 1)) * innerW)
  const y = (v: number) => PAD_TOP + innerH - (v / max) * innerH

  const points = data.map((d, i) => [x(i), y(d.total)] as const)

  // Courbe lissée (Catmull-Rom → Bézier).
  const linePath = smoothPath(points)
  const areaPath =
    `${linePath} L ${x(n - 1)} ${PAD_TOP + innerH} L ${x(0)} ${PAD_TOP + innerH} Z`

  // Étiquettes d'axe : premier, milieu, dernier (pour éviter l'encombrement).
  const labelIdx = n <= 3 ? data.map((_, i) => i) : [0, Math.floor((n - 1) / 2), n - 1]

  return (
    <div>
      <div className="mb-1 text-xs font-medium text-slate-400">Total dépensé sur la période</div>
      <div className="mb-3 text-3xl font-extrabold tracking-tight text-slate-800">
        {formatEUR(total)}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" role="img">
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

        {points.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r={n > 20 ? 0 : 2.5} fill="#ff6200" />
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
      </svg>
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
