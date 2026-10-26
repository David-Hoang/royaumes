import { ICONS } from './icons'
import { look } from './theme'

/**
 * Affiche une entité du jeu (ressource, bâtiment...) à partir du thème.
 * Le symbole est masqué aux lecteurs d'écran, qui lisent le libellé à la place.
 */
export function Entity({
  kind,
  showLabel = false,
  hideGlyph = false,
}: {
  kind: string
  showLabel?: boolean
  hideGlyph?: boolean
}) {
  const { glyph, label } = look(kind)
  return (
    <span className="entity" title={label}>
      {!hideGlyph &&
        (ICONS[kind] ? (
          <svg className="icon" viewBox="0 0 48 48" aria-hidden="true">
            {ICONS[kind]}
          </svg>
        ) : (
          <span aria-hidden="true">{glyph}</span>
        ))}
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  )
}
