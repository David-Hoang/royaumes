import type { Metadata } from 'next'
import { Alegreya_Sans, IM_Fell_English_SC } from 'next/font/google'
import type { ReactNode } from 'react'
import './globals.css'

// Polices du jeu : exposées en variables CSS, utilisées par le thème de globals.css.
const titre = IM_Fell_English_SC({ weight: '400', subsets: ['latin'], variable: '--font-titre' })
const texte = Alegreya_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-texte',
})

// Métadonnées par défaut de toutes les pages : titre de l'onglet et description.
export const metadata: Metadata = {
  title: 'Royaumes',
  description: 'Jeu multijoueur - monolithe modulaire',
}

/**
 * Mise en page racine, partagée par toutes les pages de l'application.
 * Le type des propriétés est déclaré explicitement plutôt qu'au moyen du type
 * global LayoutProps généré par Next.js : ce dernier n'existe qu'après une
 * première construction, ce qui ferait échouer la vérification des types
 * sur un dépôt fraîchement cloné.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${titre.variable} ${texte.variable}`}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
