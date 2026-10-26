import { headers } from 'next/headers'
import { requireVillage } from '@/bootstrap/require-village'
import { currentUser } from '@/bootstrap/server'
import { TavernScreen } from '@/modules/tavern/ui'

/** Page de la Taverne. Les messages du joueur connecté y sont mis en évidence. */
export default async function TavernPage() {
  await requireVillage()
  const user = await currentUser(await headers())
  return <TavernScreen userId={user?.id ?? ''} />
}
