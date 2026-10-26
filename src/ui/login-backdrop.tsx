/**
 * Décor de l'écran de connexion : un château dans la nuit, sous la lune. Il est fixé derrière
 * la page et ne porte aucune logique : il ne fait que dessiner.
 */
const INK = '#0d0a08'

/** Étoiles : position (en pixels du dessin) et rayon. Fixes, pour un rendu identique à chaque affichage. */
const STARS = [
  [80, 70, 2],
  [190, 150, 1.5],
  [310, 60, 2],
  [420, 190, 1.5],
  [530, 90, 2],
  [660, 40, 1.5],
  [760, 160, 2],
  [880, 80, 1.5],
  [990, 200, 2],
  [1090, 60, 1.5],
  [1190, 140, 2],
  [1240, 40, 1.5],
  [140, 250, 1.5],
  [250, 300, 2],
  [610, 250, 1.5],
  [940, 300, 1.5],
  [1150, 280, 2],
  [40, 160, 1.5],
] as const

/** Fenêtres allumées du château : position et taille. */
const WINDOWS = [
  [600, 470],
  [656, 440],
  [712, 470],
  [630, 540],
  [682, 540],
  [560, 560],
  [752, 560],
] as const

export function LoginBackdrop() {
  return (
    <svg
      className="login-backdrop"
      viewBox="0 0 1280 800"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0e1226" />
          <stop offset="60%" stopColor="#2b2540" />
          <stop offset="100%" stopColor="#6b3f3a" />
        </linearGradient>
        <radialGradient id="moon-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f6ecd6" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#f6ecd6" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="1280" height="800" fill="url(#night)" />
      {STARS.map(([x, y, r]) => (
        <circle key={`${x}-${y}`} className="star" cx={x} cy={y} r={r} fill="#f6ecd6" />
      ))}
      <circle cx="1020" cy="190" r="170" fill="url(#moon-glow)" />
      <circle cx="1020" cy="190" r="56" fill="#f6ecd6" />
      <circle cx="1002" cy="176" r="10" fill="#d9ceb4" />
      <circle cx="1040" cy="206" r="7" fill="#d9ceb4" />

      {/* Montagnes lointaines, puis collines. */}
      <path
        d="M0 560 L120 430 L240 520 L380 400 L520 520 L640 450 L780 540 L920 420 L1060 520 L1180 440 L1280 520 V800 H0 Z"
        fill="#241f38"
      />
      <path
        d="M0 640 C200 570 380 600 560 610 C760 620 980 560 1280 620 V800 H0 Z"
        fill="#1a1528"
      />

      {/* Le château. */}
      <g fill="#120e1c" stroke={INK} strokeWidth={4} strokeLinejoin="round">
        <path d="M520 640 V500 H556 V470 H566 V484 H586 V470 H596 V500 H620 V430 H632 V416 H648 V430 H660 V500 H684 V470 H694 V484 H714 V470 H724 V500 H760 V640 Z" />
        <path d="M600 640 V560 a40 40 0 0 1 80 0 V640 Z" fill="#0b0813" />
        <path d="M640 416 V372" />
      </g>
      <path
        d="M640 372 L676 384 L640 396 Z"
        fill="#8c2f2a"
        stroke={INK}
        strokeWidth={3}
        strokeLinejoin="round"
      />
      {WINDOWS.map(([x, y]) => (
        <rect
          key={`${x}-${y}`}
          className="window-light"
          x={x}
          y={y}
          width="14"
          height="22"
          rx="7"
          fill="#ffb347"
        />
      ))}

      {/* Premier plan : une colline sombre et deux torches. */}
      <path
        d="M0 720 C240 670 480 700 640 690 C860 676 1080 700 1280 680 V800 H0 Z"
        fill="#0b0813"
      />
      {[210, 1070].map((x) => (
        <g key={x}>
          <rect
            x={x - 5}
            y="640"
            width="10"
            height="100"
            fill="#4a3826"
            stroke={INK}
            strokeWidth={3}
          />
          <circle cx={x} cy="620" r="70" fill="#ffb347" opacity={0.18} />
          <path
            className="flame"
            d={`M${x} 580 C${x + 20} 604 ${x + 16} 636 ${x} 636 C${x - 16} 636 ${x - 20} 604 ${x} 580 Z`}
            fill="#ff9a3c"
            stroke={INK}
            strokeWidth={3}
          />
          <path
            className="flame"
            d={`M${x} 606 C${x + 10} 618 ${x + 8} 632 ${x} 632 C${x - 8} 632 ${x - 10} 618 ${x} 606 Z`}
            fill="#ffd77a"
          />
        </g>
      ))}
    </svg>
  )
}
