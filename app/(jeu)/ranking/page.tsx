import { headers } from 'next/headers'
import { requireVillage } from '@/bootstrap/require-village'
import { currentUser } from '@/bootstrap/server'
import { RankingScreen } from '@/modules/ranking/ui'

/** Page du Classement. Le joueur connecté y est mis en évidence. */
export default async function RankingPage() {
  await requireVillage()
  const user = await currentUser(await headers())
  return <RankingScreen userId={user?.id ?? ''} />
}
