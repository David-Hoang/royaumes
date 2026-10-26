import type { ReactNode } from 'react'

/**
 * Icônes des entités du jeu : de petits dessins colorés, cernés d'encre, dans le style des
 * scènes. Chaque dessin tient dans une grille de 48 x 48. Une entité sans dessin ici est
 * affichée avec son symbole du thème (theme.ts).
 */
const INK = '#1a120c'
const line = {
  stroke: INK,
  strokeWidth: 3,
  strokeLinejoin: 'round' as const,
  strokeLinecap: 'round' as const,
}

/** Un trait épais cerné d'encre : un manche, une lame. */
function Bar({ d, color, width = 5 }: { d: string; color: string; width?: number }) {
  return (
    <>
      <path d={d} stroke={INK} strokeWidth={width + 3} strokeLinecap="round" fill="none" />
      <path d={d} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" />
    </>
  )
}

/** Les dessins, par identifiant d'entité. */
export const ICONS: Record<string, ReactNode> = {
  village: (
    <>
      <path
        d="M6 43 V21 H12 V14 H17 V21 H21 V10 H27 V21 H31 V14 H36 V21 H42 V43 Z"
        fill="#c9b99a"
        {...line}
      />
      <path d="M19 43 V33 a5 5 0 0 1 10 0 V43 Z" fill="#6b4a2a" {...line} />
      <path d="M24 10 V3 L33 5 L24 8" fill="#a83a32" {...line} strokeWidth={2.5} />
    </>
  ),
  wood: (
    <>
      <circle cx="14" cy="34" r="9" fill="#c9985a" {...line} />
      <circle cx="14" cy="34" r="4" fill="#b8854a" stroke={INK} strokeWidth={2} />
      <circle cx="33" cy="34" r="9" fill="#c9985a" {...line} />
      <circle cx="33" cy="34" r="4" fill="#b8854a" stroke={INK} strokeWidth={2} />
      <circle cx="24" cy="18" r="9" fill="#d4a56a" {...line} />
      <circle cx="24" cy="18" r="4" fill="#b8854a" stroke={INK} strokeWidth={2} />
    </>
  ),
  stone: (
    <>
      <path d="M5 39 L9 22 L21 11 L36 15 L44 29 L40 40 Z" fill="#8f8678" {...line} />
      <path d="M12 24 L21 15 L31 18 L22 26 Z" fill="#b9b0a0" opacity={0.85} />
      <path d="M22 26 L26 39" stroke="#5b5348" strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  gold: (
    <>
      {[34, 25, 16].map((y) => (
        <g key={y}>
          <path d={`M9 ${y} v6 a15 5.5 0 0 0 30 0 v-6 Z`} fill="#c8962e" {...line} />
          <ellipse cx="24" cy={y} rx="15" ry="5.5" fill="#f2cf7e" {...line} />
        </g>
      ))}
    </>
  ),
  sawmill: (
    <>
      <path d="M5 30 H43 V42 H5 Z" fill="#c9985a" {...line} />
      <path d="M10 30 V42 M17 30 V42" stroke="#8a5a33" strokeWidth={2} />
      <circle cx="24" cy="17" r="13" fill="#cfd2d6" {...line} />
      <circle cx="24" cy="17" r="4" fill="#5a5249" stroke={INK} strokeWidth={2} />
      <path
        d="M24 4 V9 M24 25 V30 M11 17 H16 M32 17 H37"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </>
  ),
  quarry: (
    <>
      <Bar d="M11 43 L31 13" color="#8a5a33" />
      <path d="M13 17 Q31 2 46 18 L41 23 Q31 13 21 21 Z" fill="#b9b0a0" {...line} />
    </>
  ),
  mine: (
    <>
      <path d="M24 5 L41 18 L24 44 L7 18 Z" fill="#4fb3c0" {...line} />
      <path d="M7 18 H41 M16 18 L24 5 L32 18 L24 44 Z" fill="none" stroke={INK} strokeWidth={2} />
      <path d="M12 18 L20 8 L24 18 Z" fill="#a8e6ec" opacity={0.85} />
    </>
  ),
  dungeon: (
    <>
      <Bar d="M8 8 L37 37" color="#cfd2d6" />
      <Bar d="M40 8 L11 37" color="#cfd2d6" />
      <Bar d="M31 31 L42 42" color="#8a5a33" />
      <Bar d="M17 31 L6 42" color="#8a5a33" />
      <Bar d="M27 41 L41 27" color="#e0b45a" width={4} />
      <Bar d="M21 41 L7 27" color="#e0b45a" width={4} />
    </>
  ),
  hero: (
    <>
      <path
        d="M24 4 L40 10 V24 C40 34 33 41 24 45 C15 41 8 34 8 24 V10 Z"
        fill="#2d4f6e"
        {...line}
      />
      <path
        d="M24 11 L33 14 V24 C33 30 29 34 24 37 C19 34 15 30 15 24 V14 Z"
        fill="#e0b45a"
        {...line}
        strokeWidth={2.5}
      />
      <path d="M24 14 V35 M17 22 H31" stroke={INK} strokeWidth={2.5} strokeLinecap="round" />
    </>
  ),
  companion: (
    <>
      <path d="M24 4 V10" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx="24" cy="5" r="3" fill="#a83a32" stroke={INK} strokeWidth={2} />
      <path d="M9 42 V23 a15 14 0 0 1 30 0 V42 Z" fill="#8f8678" {...line} />
      <path d="M13 24 H35 V31 H13 Z" fill="#17120e" {...line} strokeWidth={2.5} />
      <path d="M24 31 V42" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  goblin: (
    <>
      <path
        d="M12 22 L2 14 L14 14 Z M36 22 L46 14 L34 14 Z"
        fill="#7a9c5b"
        {...line}
        strokeWidth={2.5}
      />
      <circle cx="24" cy="26" r="16" fill="#86a864" {...line} />
      <ellipse cx="18" cy="23" rx="4" ry="5" fill="#f1e6d3" stroke={INK} strokeWidth={2} />
      <ellipse cx="30" cy="23" rx="4" ry="5" fill="#f1e6d3" stroke={INK} strokeWidth={2} />
      <circle cx="19" cy="24" r="1.8" fill={INK} />
      <circle cx="29" cy="24" r="1.8" fill={INK} />
      <path d="M15 33 Q24 41 33 33 Z" fill="#8c2f2a" {...line} strokeWidth={2.5} />
    </>
  ),
  skeleton: (
    <>
      <path
        d="M24 4 C13 4 7 12 7 22 C7 28 10 31 13 33 V42 H35 V33 C38 31 41 28 41 22 C41 12 35 4 24 4 Z"
        fill="#e8dfc8"
        {...line}
      />
      <ellipse cx="17" cy="22" rx="5" ry="6" fill={INK} />
      <ellipse cx="31" cy="22" rx="5" ry="6" fill={INK} />
      <path d="M22 30 L24 27 L26 30 Z" fill={INK} />
      <path d="M17 36 V42 M24 36 V42 M31 36 V42" stroke={INK} strokeWidth={2.5} />
    </>
  ),
  troll: (
    <>
      <path
        d="M6 20 L3 6 L15 12 Z M42 20 L45 6 L33 12 Z"
        fill="#6b5a3a"
        {...line}
        strokeWidth={2.5}
      />
      <path
        d="M5 26 C5 12 14 7 24 7 C34 7 43 12 43 26 C43 38 35 44 24 44 C13 44 5 38 5 26 Z"
        fill="#7d896e"
        {...line}
      />
      <path d="M11 20 L21 24 M37 20 L27 24" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      <circle cx="17" cy="26" r="2.5" fill="#f1e6d3" stroke={INK} strokeWidth={1.5} />
      <circle cx="31" cy="26" r="2.5" fill="#f1e6d3" stroke={INK} strokeWidth={1.5} />
      <path
        d="M14 35 Q24 39 34 35"
        fill="none"
        stroke={INK}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path
        d="M16 35 L14 29 L20 36 Z M32 35 L34 29 L28 36 Z"
        fill="#f1e6d3"
        {...line}
        strokeWidth={2}
      />
    </>
  ),
  door: (
    <>
      <path d="M8 44 V20 a16 16 0 0 1 32 0 V44 Z" fill="#6b4524" {...line} />
      <path d="M16 44 V14 M24 44 V6 M32 44 V14" stroke="#3f2713" strokeWidth={2} />
      <path d="M8 24 H40 M8 34 H40" stroke="#3a342d" strokeWidth={4} />
      <circle cx="31" cy="30" r="3.5" fill="none" stroke="#e0b45a" strokeWidth={2.5} />
    </>
  ),
  ranking: (
    <>
      <path d="M14 6 H34 V20 C34 28 29 33 24 33 C19 33 14 28 14 20 Z" fill="#e0b45a" {...line} />
      <path d="M14 10 H7 C7 20 10 24 15 25 M34 10 H41 C41 20 38 24 33 25" fill="none" {...line} />
      <path d="M24 33 V39 M15 43 H33" {...line} strokeWidth={4} />
      <path d="M19 10 V20" stroke="#fff6d8" strokeWidth={3} strokeLinecap="round" />
    </>
  ),
  market: (
    <>
      <path d="M8 24 V43 H40 V24" fill="#8a5a33" {...line} />
      <path d="M4 24 L8 8 H40 L44 24 Z" fill="#e8dfc8" {...line} />
      <path
        d="M12 8 L9 24 H19 L18 8 Z M25 8 L25 24 H35 L32 8 Z"
        fill="#b8463a"
        stroke={INK}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx="17" cy="35" r="4" fill="#e0b45a" stroke={INK} strokeWidth={2} />
      <circle cx="29" cy="36" r="4" fill="#b8463a" stroke={INK} strokeWidth={2} />
    </>
  ),
  tavern: (
    <>
      <path
        d="M33 16 H38 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 H33"
        fill="none"
        {...line}
        strokeWidth={4}
      />
      <path d="M9 14 H33 V40 a3 3 0 0 1 -3 3 H12 a3 3 0 0 1 -3 -3 Z" fill="#d9972a" {...line} />
      <path
        d="M15 22 V37 M22 22 V37 M28 22 V37"
        stroke="#f2cf7e"
        strokeWidth={2.5}
        strokeLinecap="round"
        opacity={0.8}
      />
      <path
        d="M8 15 C5 8 12 5 16 9 C18 3 27 3 28 9 C33 5 38 10 34 15 Z"
        fill="#fff6e0"
        {...line}
        strokeWidth={2.5}
      />
    </>
  ),
  achievements: (
    <>
      <path
        d="M12 3 H21 L26 20 H17 Z M36 3 H27 L22 20 H31 Z"
        fill="#8c2f2a"
        {...line}
        strokeWidth={2.5}
      />
      <circle cx="24" cy="31" r="13" fill="#e0b45a" {...line} />
      <circle cx="24" cy="31" r="8" fill="#f2cf7e" stroke={INK} strokeWidth={2} />
      <path
        d="M24 25 L26 29.500 L31 30 L27 33 L28.500 38 L24 35 L19.500 38 L21 33 L17 30 L22 29.500 Z"
        fill="#c8962e"
        stroke={INK}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </>
  ),
}
