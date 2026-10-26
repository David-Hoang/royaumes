/**
 * Illustrations de la Taverne, en vue isométrique : une salle d'angle dessinée à l'encre, et les
 * clients qui s'y promènent. Ces composants ne portent aucune logique : ils ne font que dessiner.
 */
const INK = '#1a120c'
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }

/** Dimensions du dessin. */
const WIDTH = 1280
const HEIGHT = 640

/**
 * Le sol est un losange. Un point y est repéré par (u, v), de 0 à 1 : u va du coin du fond vers
 * la droite, v du coin du fond vers la gauche. Le mur de gauche est donc à u = 0, celui de droite à v = 0.
 */
const TOP = { x: 640, y: 230 }
const HALF_W = 460
const HALF_H = 200
const WALL = 190

/** Position, en pixels du dessin, du point (u, v) du sol. */
const at = (u: number, v: number) => ({
  x: TOP.x + (u - v) * HALF_W,
  y: TOP.y + (u + v) * HALF_H,
})
const pts = (...list: { x: number; y: number }[]) => list.map((p) => `${p.x},${p.y}`).join(' ')
const up = (p: { x: number; y: number }, h: number) => ({ x: p.x, y: p.y - h })

/** Position, en pourcentage de la scène, du point (u, v) du sol. */
export function floorPercent(u: number, v: number) {
  const p = at(u, v)
  return { left: (p.x / WIDTH) * 100, top: (p.y / HEIGHT) * 100 }
}

/** Zone du sol où les clients peuvent marcher : le comptoir est à gauche, les murs au fond. */
export const WALKABLE = { minU: 0.24, maxU: 0.94, minV: 0.1, maxV: 0.94 }

/** Tables rondes : leur position au sol et le rayon (en u, v) à laisser libre autour. */
export const TABLES = [
  { u: 0.5, v: 0.3 },
  { u: 0.72, v: 0.7 },
]
export const TABLE_CLEARANCE = 0.14

/** Le décor : le sol, deux murs, une cheminée, un comptoir, des tables et des tonneaux. */
export function TavernRoom() {
  const top = at(0, 0)
  const right = at(1, 0)
  const left = at(0, 1)
  const bottom = at(1, 1)
  const planks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
  const hearthA = at(0.4, 0)
  const hearthB = at(0.6, 0)
  const bar = { u0: 0.04, u1: 0.17, v0: 0.12, v1: 0.88, h: 62 }
  return (
    <svg className="scene-art" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <defs>
        <radialGradient id="tavern-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb347" stopOpacity={0.5} />
          <stop offset="100%" stopColor="#ffb347" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill="#17120e" />

      {/* Murs : à gauche (clair), à droite (plus sombre). */}
      <polygon points={pts(left, top, up(top, WALL), up(left, WALL))} fill="#8a5a33" {...line} />
      <polygon points={pts(top, right, up(right, WALL), up(top, WALL))} fill="#6b4524" {...line} />
      {[0.2, 0.4, 0.6, 0.8].map((t) => {
        const a = at(0, t)
        const b = at(t, 0)
        return (
          <g key={t} stroke="#3f2713" strokeWidth={2} opacity={0.6}>
            <path d={`M${a.x} ${a.y} V${a.y - WALL}`} />
            <path d={`M${b.x} ${b.y} V${b.y - WALL}`} />
          </g>
        )
      })}

      {/* Sol de planches, avec l'épaisseur des bords visibles. */}
      <polygon points={pts(top, right, bottom, left)} fill="#7a5230" {...line} />
      {planks.map((t) => {
        const a = at(0, t)
        const b = at(1, t)
        return <path key={t} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} stroke="#5a3a1c" strokeWidth={2} />
      })}
      <polygon
        points={pts(left, bottom, up(bottom, -22), up(left, -22))}
        fill="#3f2713"
        {...line}
      />
      <polygon
        points={pts(bottom, right, up(right, -22), up(bottom, -22))}
        fill="#2f1d0e"
        {...line}
      />

      {/* Cheminée, contre le mur de droite. */}
      <polygon
        points={pts(hearthA, hearthB, up(hearthB, 130), up(hearthA, 130))}
        fill="#8f8678"
        {...line}
      />
      <polygon
        points={pts(at(0.43, 0), at(0.57, 0), up(at(0.57, 0), 80), up(at(0.43, 0), 80))}
        fill="#17120e"
      />
      <circle cx={at(0.5, 0).x} cy={at(0.5, 0).y - 40} r="120" fill="url(#tavern-glow)" />
      <path
        className="flame"
        d={`M${at(0.5, 0).x} ${at(0.5, 0).y - 74} c22 22 18 56 0 62 c-18 -6 -22 -40 0 -62 Z`}
        fill="#ff9a3c"
        stroke={INK}
        strokeWidth={3}
      />
      <path
        className="flame"
        d={`M${at(0.5, 0).x} ${at(0.5, 0).y - 50} c11 12 9 30 0 34 c-9 -4 -11 -22 0 -34 Z`}
        fill="#ffd77a"
      />

      {/* Lanternes accrochées aux deux murs. */}
      {[at(0, 0.5), at(0.8, 0)].map((p) => (
        <g key={`${p.x}-${p.y}`}>
          <circle cx={p.x} cy={p.y - 120} r="90" fill="url(#tavern-glow)" />
          <path d={`M${p.x} ${p.y - WALL} V${p.y - 140}`} stroke={INK} strokeWidth={3} />
          <rect
            x={p.x - 12}
            y={p.y - 140}
            width="24"
            height="30"
            rx="4"
            fill="#ffd77a"
            {...line}
            strokeWidth={3}
          />
        </g>
      ))}

      {/* Comptoir, le long du mur de gauche : dessus, côté visible, bout. */}
      <polygon
        points={pts(
          up(at(bar.u1, bar.v0), 0),
          up(at(bar.u1, bar.v1), 0),
          up(at(bar.u1, bar.v1), bar.h),
          up(at(bar.u1, bar.v0), bar.h),
        )}
        fill="#6b4524"
        {...line}
      />
      <polygon
        points={pts(
          at(bar.u0, bar.v1),
          at(bar.u1, bar.v1),
          up(at(bar.u1, bar.v1), bar.h),
          up(at(bar.u0, bar.v1), bar.h),
        )}
        fill="#5a381c"
        {...line}
      />
      <polygon
        points={pts(
          up(at(bar.u0, bar.v0), bar.h),
          up(at(bar.u1, bar.v0), bar.h),
          up(at(bar.u1, bar.v1), bar.h),
          up(at(bar.u0, bar.v1), bar.h),
        )}
        fill="#a06f3c"
        {...line}
      />
      {[0.25, 0.4, 0.6, 0.75].map((v, i) => {
        const p = up(at((bar.u0 + bar.u1) / 2, v), bar.h)
        return i % 2 === 0 ? (
          <path
            key={v}
            d={`M${p.x - 6} ${p.y} v-30 h12 v30 Z`}
            fill={i === 0 ? '#2d4f6e' : '#4f6b3a'}
            {...line}
            strokeWidth={3}
          />
        ) : (
          <path
            key={v}
            d={`M${p.x - 8} ${p.y} v-16 h16 v16 Z M${p.x + 8} ${p.y - 12} h6 v8 h-6`}
            fill="#e0b45a"
            {...line}
            strokeWidth={3}
          />
        )
      })}

      {/* Tables rondes. */}
      {TABLES.map((t) => {
        const p = at(t.u, t.v)
        return (
          <g key={`${t.u}-${t.v}`}>
            <ellipse
              cx={p.x - 62}
              cy={p.y + 6}
              rx="20"
              ry="10"
              fill="#4a2f18"
              {...line}
              strokeWidth={3}
            />
            <ellipse
              cx={p.x + 62}
              cy={p.y + 6}
              rx="20"
              ry="10"
              fill="#4a2f18"
              {...line}
              strokeWidth={3}
            />
            <path
              d={`M${p.x - 8} ${p.y} v-38 h16 v38 Z`}
              fill="#4a2f18"
              {...line}
              strokeWidth={3}
            />
            <ellipse cx={p.x} cy={p.y - 38} rx="56" ry="26" fill="#a06f3c" {...line} />
            <ellipse
              cx={p.x - 14}
              cy={p.y - 42}
              rx="9"
              ry="4"
              fill="#e0b45a"
              {...line}
              strokeWidth={2}
            />
          </g>
        )
      })}

      {/* Tonneaux, dans l'angle de droite. */}
      {[at(0.9, 0.04), at(0.97, 0.12)].map((p) => (
        <g key={`${p.x}-${p.y}`}>
          <path
            d={`M${p.x - 24} ${p.y - 46} v40 a24 10 0 0 0 48 0 v-40 Z`}
            fill="#6b4524"
            {...line}
            strokeWidth={3}
          />
          <ellipse
            cx={p.x}
            cy={p.y - 46}
            rx="24"
            ry="10"
            fill="#8a5a33"
            {...line}
            strokeWidth={3}
          />
          <path
            d={`M${p.x - 24} ${p.y - 30} a24 10 0 0 0 48 0 M${p.x - 24} ${p.y - 14} a24 10 0 0 0 48 0`}
            fill="none"
            stroke={INK}
            strokeWidth={2.5}
          />
        </g>
      ))}
    </svg>
  )
}

const CLOTHS = ['#8c2f2a', '#2d4f6e', '#4f6b3a', '#6a4a8a', '#a36a2a', '#4a443c']

/** Un petit personnage : une tête, un buste, un chapeau ; la couleur change d'un joueur à l'autre. */
export function Patron({ index }: { index: number }) {
  const cloth = CLOTHS[index % CLOTHS.length] ?? '#8c2f2a'
  return (
    <svg viewBox="0 0 60 84" aria-hidden="true">
      <ellipse cx="30" cy="80" rx="20" ry="5" fill="#000" opacity={0.3} />
      <path
        d="M12 78 V52 C12 42 22 38 30 38 C38 38 48 42 48 52 V78 Z"
        fill={cloth}
        {...line}
        strokeWidth={3}
      />
      <circle cx="30" cy="26" r="14" fill="#e8c9a0" {...line} strokeWidth={3} />
      <path d="M12 22 H48 L43 8 H17 Z" fill="#3a2a1a" {...line} strokeWidth={3} />
      <circle cx="25" cy="28" r="2" fill={INK} />
      <circle cx="35" cy="28" r="2" fill={INK} />
    </svg>
  )
}
