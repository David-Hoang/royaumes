import { headers } from 'next/headers'
import { currentUser } from '@/bootstrap/server'
import { AchievementsScreen } from '@/modules/achievements/ui'

/** Page des Hauts faits. Le joueur connecté sert à retenir les hauts faits déjà montrés. */
export default async function AchievementsPage() {
  const user = await currentUser(await headers())
  return <AchievementsScreen userId={user?.id ?? ''} />
}
