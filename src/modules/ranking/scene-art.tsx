/**
 * Illustrations du Classement : le podium et ses champions, dessinés à l'encre.
 * Ces composants ne portent aucune logique : ils ne font que dessiner.
 */
const INK = '#1a120c'
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }

/** Dimensions du dessin ; la page place les noms par-dessus, en pourcentages de ces valeurs. */
export const PODIUM = {
  width: 600,
  height: 400,
  floor: 372,
  /** Pour chaque place (1, 2, 3) : abscisse et hauteur du bloc, et couleur du champion. */
  places: [
    { x: 220, w: 160, h: 170, cloth: '#8c2f2a', shine: '#e0b45a' },
    { x: 36, w: 160, h: 120, cloth: '#2d4f6e', shine: '#c9c2b4' },
    { x: 404, w: 160, h: 84, cloth: '#4f6b3a', shine: '#c98a4a' },
  ],
}

/** Un champion de face, debout sur un bloc : casque à plume, bouclier, et la couronne s'il est premier. */
function Champion({
  cx,
  base,
  cloth,
  shine,
  crowned,
}: {
  cx: number
  base: number
  cloth: string
  shine: string
  crowned: boolean
}) {
  return (
    <g transform={`translate(${cx - 30} ${base - 112})`}>
      <ellipse cx="30" cy="110" rx="26" ry="5" fill="#000" opacity={0.3} />
      <path
        d="M10 108 V68 C10 56 20 52 30 52 C40 52 50 56 50 68 V108 Z"
        fill={cloth}
        {...line}
        strokeWidth={3}
      />
      <circle cx="30" cy="36" r="17" fill="#b9b0a0" {...line} strokeWidth={3} />
      <rect x="19" y="32" width="22" height="5" fill={INK} />
      <path d="M30 20 C38 6 50 8 48 22" fill={shine} {...line} strokeWidth={3} />
      <path
        d="M2 72 L28 66 V98 C28 106 16 110 2 114 C-8 110 -12 106 -12 98 V76 Z"
        fill="#5a5249"
        {...line}
        strokeWidth={3}
      />
      <path d="M56 104 V40" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <path d="M56 40 H80 L72 51 L80 62 H56 Z" fill={shine} {...line} strokeWidth={3} />
      {crowned && (
        <path
          d="M16 18 L20 2 L26 12 L30 -2 L34 12 L40 2 L44 18 Z"
          fill="#e0b45a"
          {...line}
          strokeWidth={3}
        />
      )}
    </g>
  )
}

/** Le podium : trois blocs de pierre, leurs champions, un projecteur, des torches et des lauriers. */
export function PodiumArt() {
  const { width, height, floor, places } = PODIUM
  return (
    <svg className="podium-art" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id="podium-beam" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffe9a8" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="podium-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#cfc6b4" />
          <stop offset="100%" stopColor="#7d7466" />
        </linearGradient>
      </defs>

      {/* Projecteur sur le premier. */}
      <path d={`M270 0 H330 L400 ${floor} H200 Z`} fill="url(#podium-beam)" />

      {/* Torches sur les côtés. */}
      {[16, width - 16].map((x) => (
        <g key={x}>
          <rect
            x={x - 5}
            y="250"
            width="10"
            height="110"
            fill="#5a4430"
            {...line}
            strokeWidth={3}
          />
          <path
            className="flame"
            d={`M${x} 196 C${x + 22} 224 ${x + 18} 252 ${x} 252 C${x - 18} 252 ${x - 22} 224 ${x} 196 Z`}
            fill="#ff9a3c"
            stroke={INK}
            strokeWidth={3}
          />
          <path
            className="flame"
            d={`M${x} 222 C${x + 11} 234 ${x + 9} 248 ${x} 248 C${x - 9} 248 ${x - 11} 234 ${x} 222 Z`}
            fill="#ffd77a"
          />
        </g>
      ))}

      {/* Lauriers derrière le premier. */}
      <path
        d="M232 150 C214 110 236 60 300 42 C364 60 386 110 368 150"
        fill="none"
        stroke="#4f6b3a"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M232 150 C214 110 236 60 300 42 C364 60 386 110 368 150"
        fill="none"
        stroke={INK}
        strokeWidth={2}
        strokeDasharray="2 12"
        strokeLinecap="round"
      />

      <rect y={floor} width={width} height={height - floor} fill="#3f3328" {...line} />

      {places.map((place, index) => {
        const top = floor - place.h
        return (
          <g key={place.x}>
            <rect
              x={place.x}
              y={top}
              width={place.w}
              height={place.h}
              fill="url(#podium-stone)"
              {...line}
            />
            <rect
              x={place.x}
              y={top}
              width={place.w}
              height="12"
              fill="#e0b45a"
              {...line}
              strokeWidth={3}
            />
            <path
              d={`M${place.x + 10} ${floor - 8} H${place.x + place.w - 10}`}
              stroke={INK}
              strokeWidth={2}
              opacity={0.4}
            />
            <Champion
              cx={place.x + place.w / 2}
              base={top}
              cloth={place.cloth}
              shine={place.shine}
              crowned={index === 0}
            />
          </g>
        )
      })}
    </svg>
  )
}
