import { requireVillage } from '@/bootstrap/require-village'
import { DungeonLobby } from '@/modules/dungeon/ui'

/** Page du Donjon : liste des expéditions ouvertes et ouverture d'une expédition. */
export default async function DungeonPage() {
  await requireVillage()
  return <DungeonLobby />
}
