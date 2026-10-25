/**
 * Illustrations du Donjon : le décor, les héros, les monstres et la porte, dessinés à l'encre.
 * Ces composants ne portent aucune logique : ils ne font que dessiner.
 */
import type { MonsterKind } from './contracts'

const INK = '#1a120c'
const line = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }

/** Un chevalier de face, avec un bouclier : la couleur de sa tunique distingue les héros. */
export function Knight({ cloth, plume }: { cloth: string; plume: string }) {
  return (
    <svg viewBox="-10 0 150 226" aria-hidden="true">
      <path d="M40 78 C40 30 100 30 100 78 V96 H40 Z" fill="#b9b0a0" {...line} />
      <rect x="52" y="64" width="36" height="9" fill={INK} />
      <path d="M70 28 C80 12 96 14 94 30" fill={plume} {...line} strokeWidth={3} />
      <path d="M34 98 H106 L112 190 H28 Z" fill={cloth} {...line} />
      <path
        d="M22 110 L56 100 V180 C56 196 36 204 22 210 C8 204 -2 196 -2 180 V110 Z"
        fill="#5a5249"
        {...line}
      />
      <path d="M28 190 V224 M110 190 V224" stroke={INK} strokeWidth={12} />
    </svg>
  )
}

/** Un monstre : gobelin, squelette ou troll. */
export function MonsterArt({ kind }: { kind: MonsterKind }) {
  if (kind === 'skeleton') {
    return (
      <svg viewBox="0 0 200 300" aria-hidden="true">
        <path
          d="M50 110 C50 30 150 30 150 110 C150 140 130 150 128 170 H72 C70 150 50 140 50 110 Z"
          fill="#e8dfc8"
          {...line}
        />
        <ellipse cx="80" cy="100" rx="16" ry="20" fill={INK} />
        <ellipse cx="120" cy="100" rx="16" ry="20" fill={INK} />
        <path d="M94 132 L100 122 L106 132 Z" fill={INK} />
        <path
          d="M80 170 V186 M92 170 V186 M104 170 V186 M116 170 V186"
          stroke={INK}
          strokeWidth={4}
        />
        <path d="M100 190 V270" stroke={INK} strokeWidth={8} />
        <path
          d="M64 206 H136 M70 228 H130 M76 250 H124"
          stroke="#e8dfc8"
          strokeWidth={10}
          strokeLinecap="round"
        />
        <path
          d="M64 206 H136 M70 228 H130 M76 250 H124"
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.6}
        />
        <path d="M150 190 L190 130" stroke="#8a5a33" strokeWidth={10} strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'troll') {
    return (
      <svg viewBox="0 0 280 320" aria-hidden="true">
        <path
          d="M30 150 C20 60 90 20 140 20 C190 20 260 60 250 150 L262 310 H18 Z"
          fill="#6f7a62"
          {...line}
        />
        <path
          d="M70 130 C70 80 110 56 140 56 C170 56 210 80 210 130 C210 170 180 190 140 190 C100 190 70 170 70 130 Z"
          fill="#7d896e"
          {...line}
        />
        <ellipse cx="116" cy="118" rx="14" ry="12" fill="#f1e6d3" {...line} strokeWidth={3} />
        <ellipse cx="164" cy="118" rx="14" ry="12" fill="#f1e6d3" {...line} strokeWidth={3} />
        <circle cx="118" cy="120" r="5" fill={INK} />
        <circle cx="162" cy="120" r="5" fill={INK} />
        <path
          d="M104 160 C124 176 156 176 176 160"
          fill="none"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d="M112 164 L106 190 L122 170 Z M168 164 L174 190 L158 170 Z"
          fill="#f1e6d3"
          {...line}
          strokeWidth={3}
        />
        <path d="M200 200 L270 110 L286 124 L226 226 Z" fill="#6b4a2a" {...line} />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 220 300" aria-hidden="true">
      <path
        d="M40 150 C34 100 70 82 110 82 C150 82 186 100 180 150 L186 280 H34 Z"
        fill="#6b4a2a"
        {...line}
      />
      <path d="M46 70 L8 36 L66 44 Z M174 70 L212 36 L154 44 Z" fill="#7a9c5b" {...line} />
      <path
        d="M40 80 C40 34 70 12 110 12 C150 12 180 34 180 80 C180 116 150 136 110 136 C70 136 40 116 40 80 Z"
        fill="#86a864"
        {...line}
      />
      <ellipse cx="80" cy="72" rx="15" ry="18" fill="#f1e6d3" {...line} strokeWidth={3} />
      <ellipse cx="140" cy="72" rx="15" ry="18" fill="#f1e6d3" {...line} strokeWidth={3} />
      <circle cx="84" cy="76" r="6" fill={INK} />
      <circle cx="136" cy="76" r="6" fill={INK} />
      <path d="M68 104 C90 130 130 130 152 104 Z" fill="#8c2f2a" {...line} strokeWidth={3} />
      <path d="M84 108 V120 M110 112 V126 M136 108 V120" stroke="#f1e6d3" strokeWidth={5} />
      <path d="M170 150 L206 70" stroke="#6b4a2a" strokeWidth={12} strokeLinecap="round" />
    </svg>
  )
}

/** La porte de la salle suivante : du bois, des bandes de fer et un anneau. */
export function DoorArt() {
  return (
    <svg viewBox="0 0 160 230" aria-hidden="true">
      <path d="M10 226 V84 a70 70 0 0 1 140 0 V226 Z" fill="#6b4524" {...line} />
      <path d="M45 226 V60 M80 226 V16 M115 226 V60" fill="none" stroke="#3f2713" strokeWidth={3} />
      <g fill="#3a342d" stroke={INK} strokeWidth={3}>
        <rect x="10" y="100" width="140" height="14" />
        <rect x="10" y="164" width="140" height="14" />
      </g>
      <circle cx="112" cy="140" r="10" fill="none" stroke="#e0b45a" strokeWidth={5} />
    </svg>
  )
}

/** Le décor du donjon : un mur de briques, une arche, des torches et un sol dallé. */
export function DungeonWall() {
  return (
    <svg className="scene-art" viewBox="0 0 1280 640" aria-hidden="true">
      <defs>
        <pattern id="dungeon-bricks" width="96" height="48" patternUnits="userSpaceOnUse">
          <rect width="96" height="48" fill="#352c24" />
          <path
            d="M0 0 H96 M0 24 H96 M0 0 V24 M48 24 V48"
            fill="none"
            stroke="#1a140f"
            strokeWidth={3}
          />
        </pattern>
        <radialGradient id="dungeon-torch" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb347" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#ffb347" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width="1280" height="640" fill="url(#dungeon-bricks)" />
      <path
        d="M330 560 V250 a310 250 0 0 1 620 0 V560 Z"
        fill="#0f0c09"
        stroke={INK}
        strokeWidth={8}
      />
      <path d="M360 560 V258 a280 220 0 0 1 560 0 V560 Z" fill="#17120e" />
      <circle cx="150" cy="190" r="190" fill="url(#dungeon-torch)" />
      <circle cx="1130" cy="190" r="190" fill="url(#dungeon-torch)" />
      {[150, 1130].map((x) => (
        <g key={x}>
          <rect
            x={x - 6}
            y="210"
            width="12"
            height="70"
            fill="#5a4430"
            stroke="#0f0c09"
            strokeWidth={3}
          />
          <path
            className="flame"
            d={`M${x} 136 C${x + 26} 166 ${x + 22} 204 ${x} 204 C${x - 22} 204 ${x - 26} 166 ${x} 136 Z`}
            fill="#ff9a3c"
            stroke="#0f0c09"
            strokeWidth={3}
          />
          <path
            className="flame"
            d={`M${x} 166 C${x + 14} 182 ${x + 12} 200 ${x} 200 C${x - 12} 200 ${x - 14} 182 ${x} 166 Z`}
            fill="#ffd77a"
          />
        </g>
      ))}
      <rect y="520" width="1280" height="120" fill="#4a3d31" stroke="#0f0c09" strokeWidth={5} />
      <path
        d="M0 580 H1280 M160 520 L120 640 M480 520 L460 640 M800 520 L800 640 M1120 520 L1150 640"
        fill="none"
        stroke="#2a2018"
        strokeWidth={3}
      />
    </svg>
  )
}
