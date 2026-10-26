import { requireVillage } from '@/bootstrap/require-village'
import { MarketScreen } from '@/modules/market/ui'

/** Page du Marché. Réservée aux joueurs connectés (mise en page du jeu) qui ont fondé leur village. */
export default async function MarketPage() {
  await requireVillage()
  return <MarketScreen />
}
