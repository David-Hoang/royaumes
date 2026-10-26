import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireVillage } from '@/bootstrap/require-village'
import { currentUser } from '@/bootstrap/server'
import { AppShell } from '@/ui/app-shell'
import { KingdomMap } from '@/ui/kingdom-map'

// L'affichage dépend de la session : la page est évaluée à chaque requête.
export const dynamic = 'force-dynamic'

/** Page d'accueil : la carte du royaume pour un joueur connecté, la connexion sinon. */
export default async function Home() {
  const user = await currentUser(await headers())
  if (!user) redirect('/login')
  await requireVillage()
  return (
    <AppShell userName={user.name}>
      <KingdomMap />
    </AppShell>
  )
}
