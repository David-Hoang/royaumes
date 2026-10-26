import Link from 'next/link'

/** Un lieu de la carte : son adresse, son nom, et sa position (en pixels d'une carte de 1280 x 800). */
interface Place {
  href: string
  label: string
  x: number
  y: number
}

const PLACES: Place[] = [
  { href: '/tavern', label: 'La Taverne', x: 300, y: 290 },
  { href: '/ranking', label: "L'Arène", x: 640, y: 250 },
  { href: '/dungeon', label: 'Le Donjon', x: 930, y: 270 },
  { href: '/village', label: 'Le Village', x: 470, y: 440 },
  { href: '/market', label: 'Le Marché', x: 740, y: 560 },
  { href: '/achievements', label: 'Les Trophées', x: 980, y: 500 },
]

const INK = '#1a120c'

/** Dessin d'un lieu : un croquis à l'encre, de 100 x 100. */
function Sketch({ href }: { href: string }) {
  const line = { stroke: INK, strokeWidth: 3, strokeLinejoin: 'round' as const }
  switch (href) {
    case '/tavern':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M14 90 V52 L50 26 L86 52 V90 Z" fill="#8a5a33" {...line} />
          <path d="M8 56 L50 22 L92 56 Z" fill="#5a3a22" {...line} />
          <path d="M42 90 V68 a8 8 0 0 1 16 0 V90 Z" fill="#2a1810" {...line} />
          <rect x="66" y="22" width="9" height="20" fill="#6b4a2a" {...line} strokeWidth={2.5} />
          <circle className="smoke" cx="70" cy="18" r="4" fill="#d9d2c2" />
          <circle className="smoke late" cx="70" cy="18" r="3" fill="#d9d2c2" />
          <rect x="20" y="58" width="14" height="14" fill="#ffb347" {...line} />
          <path d="M86 56 H98" {...line} />
          <rect x="92" y="58" width="8" height="12" fill="#e0b45a" {...line} strokeWidth={2} />
        </svg>
      )
    case '/ranking':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M28 90 V40 H72 V90 Z" fill="#a39884" {...line} />
          <path d="M24 40 V26 H34 V34 H44 V26 H56 V34 H66 V26 H76 V40 Z" fill="#8f8678" {...line} />
          <path d="M44 90 V68 a6 6 0 0 1 12 0 V90 Z" fill="#2a1810" {...line} />
          <path d="M50 26 V6" {...line} />
          <path
            className="pennant"
            d="M50 6 L68 12 L50 18 Z"
            fill="#e0b45a"
            {...line}
            strokeWidth={2.5}
          />
        </svg>
      )
    case '/dungeon':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M2 92 L38 28 L66 62 L84 38 L100 92 Z" fill="#8f8678" {...line} />
          <path d="M36 92 V70 a14 16 0 0 1 28 0 V92 Z" fill="#0f0c09" {...line} />
          <path
            className="flame"
            d="M26 78 c8 -10 8 -14 4 -22 c10 6 12 18 -4 22z"
            fill="#ff9a3c"
            stroke={INK}
            strokeWidth={1.5}
          />
          <path
            className="flame"
            d="M74 78 c8 -10 8 -14 4 -22 c10 6 12 18 -4 22z"
            fill="#ff9a3c"
            stroke={INK}
            strokeWidth={1.5}
          />
        </svg>
      )
    case '/village':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M10 88 V44 H20 V34 H28 V44 H36 V24 H64 V44 H72 V34 H80 V44 H90 V88 Z"
            fill="#c9b99a"
            {...line}
          />
          <path d="M42 88 V68 a8 8 0 0 1 16 0 V88 Z" fill="#6b4a2a" {...line} />
          <path d="M50 24 V8" {...line} />
          <path
            className="pennant"
            d="M50 8 L66 13 L50 18 Z"
            fill="#a83a32"
            {...line}
            strokeWidth={2.5}
          />
        </svg>
      )
    case '/market':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M6 88 L30 44 L54 88 Z" fill="#b8463a" {...line} />
          <path d="M42 88 L68 40 L94 88 Z" fill="#e0b45a" {...line} />
          <rect x="46" y="72" width="16" height="16" fill="#8a5a33" {...line} strokeWidth={2.5} />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M8 42 L50 18 L92 42 Z" fill="#b9b0a0" {...line} />
          <g fill="#d4ccb8" stroke={INK} strokeWidth={2.5}>
            <rect x="14" y="44" width="10" height="38" />
            <rect x="34" y="44" width="10" height="38" />
            <rect x="56" y="44" width="10" height="38" />
            <rect x="76" y="44" width="10" height="38" />
          </g>
          <path d="M6 82 H94 V92 H6 Z" fill="#8f8678" {...line} />
          <path d="M50 18 V6" {...line} />
          <path
            className="pennant"
            d="M50 6 L66 10 L50 15 Z"
            fill="#a83a32"
            {...line}
            strokeWidth={2.5}
          />
        </svg>
      )
  }
}

/**
 * La carte du royaume : l'écran d'accueil du jeu. Chaque lieu est un lien vers l'écran
 * correspondant ; la navigation se fait en cliquant sur le décor.
 */
export function KingdomMap() {
  return (
    <>
      <div className="map">
        <svg viewBox="0 0 1280 800" className="map-art" aria-hidden="true">
          <defs>
            <radialGradient id="parch" cx="50%" cy="48%" r="62%">
              <stop offset="0%" stopColor="#efe0b4" />
              <stop offset="70%" stopColor="#dcc690" />
              <stop offset="100%" stopColor="#b99a62" />
            </radialGradient>
          </defs>
          <path
            d="M110 130 C300 96 500 134 700 104 C900 84 1100 112 1170 176 C1200 336 1180 486 1158 628 C1100 712 900 730 700 708 C500 728 300 708 150 668 C92 520 100 300 110 130 Z"
            fill="url(#parch)"
            stroke="#5a3f1c"
            strokeWidth={5}
          />
          <path
            d="M130 150 C300 118 500 152 700 124 C900 106 1090 130 1150 190 C1178 340 1160 480 1140 612 C1090 690 900 708 700 688 C500 708 310 690 170 652 C116 520 122 310 130 150 Z"
            fill="none"
            stroke="#8a6d3b"
            strokeWidth={2}
            strokeDasharray="2 7"
          />
          <path
            d="M205 230 C305 168 460 188 560 178 C700 158 840 178 960 198 C1062 218 1102 304 1092 404 C1086 504 1042 584 944 612 C802 652 622 642 482 622 C342 602 232 562 204 462 C184 382 184 284 205 230 Z"
            fill="#d6c08a"
            stroke="#4a3620"
            strokeWidth={3.5}
          />
          <g fill="none" stroke="#6b8896" strokeWidth={2.4} strokeLinecap="round">
            <path className="wave" d="M150 560 q14 -10 28 0 t28 0 t28 0" />
            <path className="wave" d="M180 600 q14 -10 28 0 t28 0 t28 0" />
            <path className="wave" d="M1110 520 q14 -10 28 0 t28 0" />
            <path className="wave" d="M1080 580 q14 -10 28 0 t28 0" />
            <path className="wave" d="M600 700 q14 -10 28 0 t28 0 t28 0" />
            <path className="wave" d="M900 690 q14 -10 28 0 t28 0 t28 0" />
          </g>
          <path
            d="M900 300 C860 380 800 420 760 470 C720 520 680 600 640 648"
            fill="none"
            stroke="#7f98a4"
            strokeWidth={6}
            strokeLinecap="round"
          />
          <g
            fill="none"
            stroke="#6b4f2a"
            strokeWidth={3}
            strokeDasharray="2 9"
            strokeLinecap="round"
          >
            <path d="M470 440 C560 470 650 540 740 560" />
            <path d="M470 440 C400 400 340 340 300 290" />
            <path d="M470 440 C520 360 580 300 640 250" />
            <path d="M640 250 C720 230 820 240 930 270" />
            <path d="M740 560 C820 560 900 540 980 500" />
          </g>
          <g fill="#cdb98a" stroke="#4a3620" strokeWidth={2.5} strokeLinejoin="round">
            <path d="M850 320 L905 225 L960 320 Z" />
            <path d="M930 330 L990 214 L1050 330 Z" />
            <path d="M1010 330 L1060 240 L1100 330 Z" />
            <path d="M790 340 L836 262 L884 340 Z" />
          </g>
          <g fill="#7d8d5a" stroke="#3a4a2a" strokeWidth={2} strokeLinejoin="round">
            <path d="M240 330 l12 24 h-24z" />
            <path d="M270 350 l12 24 h-24z" />
            <path d="M236 372 l12 24 h-24z" />
            <path d="M300 370 l12 24 h-24z" />
            <path d="M262 396 l12 24 h-24z" />
            <path d="M560 560 l12 24 h-24z" />
            <path d="M590 578 l12 24 h-24z" />
            <path d="M530 588 l12 24 h-24z" />
            <path d="M1020 410 l12 24 h-24z" />
            <path d="M1050 432 l12 24 h-24z" />
            <path d="M360 560 l12 24 h-24z" />
          </g>
          <g transform="translate(1090 660)" stroke="#2b1d10" strokeWidth={2} fill="none">
            <circle r={34} />
            <path d="M0 -34 L8 0 L0 34 L-8 0 Z" fill="#a83a32" />
            <path d="M-34 0 L0 -8 L34 0 L0 8 Z" fill="#8a6d3b" />
          </g>
          <g className="bird" fill="none" stroke="#2b1d10" strokeWidth={2.5} strokeLinecap="round">
            <path d="M0 0 q7 -7 14 0 q7 -7 14 0" />
            <path d="M34 12 q5 -5 10 0 q5 -5 10 0" />
          </g>
          <path d="M410 78 H870 L850 118 H430 Z" fill="#a83a32" stroke="#2b1d10" strokeWidth={3} />
          <text
            x="640"
            y="108"
            textAnchor="middle"
            fontSize={34}
            fill="#f6e3b0"
            letterSpacing={2}
            style={{ fontFamily: 'var(--font-titre), Georgia, serif' }}
          >
            Le royaume de Valombre
          </text>
        </svg>
        {PLACES.map((place) => (
          <Link
            key={place.href}
            href={place.href}
            className="loc"
            style={{ left: `${(place.x / 1280) * 100}%`, top: `${(place.y / 800) * 100}%` }}
          >
            <Sketch href={place.href} />
            <span className="loc-label">{place.label}</span>
          </Link>
        ))}
      </div>
      <p className="scroll say">Cliquez sur un lieu de la carte pour y entrer, seigneur.</p>
    </>
  )
}
