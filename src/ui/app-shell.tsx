'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { authClient } from '@/platform/auth/client'

/** Liens de navigation : chaque module ajouté au jeu y reçoit une entrée. */
export const NAV = [
  { href: '/village', kind: 'village', label: 'Village' },
  { href: '/dungeon', kind: 'dungeon', label: 'Donjon' },
  { href: '/ranking', kind: 'ranking', label: 'Classement' },
  { href: '/market', kind: 'market', label: 'Marché' },
  { href: '/tavern', kind: 'tavern', label: 'Taverne' },
  { href: '/achievements', kind: 'achievements', label: 'Hauts faits' },
]

/** Une torche qui vacille ; décorative, donc cachée aux lecteurs d'écran. */
function Torch() {
  return (
    <svg className="flame" width="22" height="42" viewBox="0 0 34 64" aria-hidden="true">
      <rect x="14" y="30" width="6" height="32" fill="#5a4430" stroke="#0f0c09" strokeWidth="2" />
      <path
        d="M17 2 C30 18 28 32 17 32 C6 32 4 18 17 2 Z"
        fill="#ff9a3c"
        stroke="#0f0c09"
        strokeWidth="2"
      />
      <path d="M17 12 C23 22 22 30 17 30 C12 30 11 22 17 12 Z" fill="#ffd77a" />
    </svg>
  )
}

/** Cadre de l'espace de jeu : barre de fer, navigation, nom du joueur et déconnexion. */
export function AppShell({ userName, children }: { userName: string; children: ReactNode }) {
  const pathname = usePathname()

  async function signOut() {
    // La session est supprimée côté serveur, puis la page est entièrement rechargée,
    // afin qu'aucun état de la session précédente ne subsiste dans le navigateur.
    await authClient.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <header className="hud">
        <div className="hud-brand">
          <Torch />
          <Link href="/" className="hud-title">
            Royaumes
          </Link>
          <Torch />
        </div>
        <nav className="hud-nav" aria-label="Navigation principale">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hud-user">
          <span>{userName}</span>
          <Link href="/account" aria-current={pathname === '/account' ? 'page' : undefined}>
            Mes données
          </Link>
          <button className="link" type="button" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </header>
      {children}
    </>
  )
}
