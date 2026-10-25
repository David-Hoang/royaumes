# ADR-0010 - Tables de lecture tenues par une projection pour les Hauts faits

- Statut : accepté
- Date : 2026-10-24
- Mise à jour : 2026-10-25 (tables et compteurs ajoutés ; la décision est inchangée)

## Contexte

Les Hauts faits récompensent des actions faites dans le Donjon, le Village et le Marché. Le module n'a
aucune commande : le joueur ne fait rien d'autre que consulter sa progression. Tout ce qu'il
affiche se déduit d'événements que d'autres modules ont déjà écrits dans le journal.

Les données du module sont des compteurs rattachés à un joueur. Elles doivent pouvoir être
exportées et effacées avec son compte (ADR 0008). L'hébergement ne permet aucun processus
permanent (ADR 0004).

## Décision

Le module n'a pas de journal d'événements propre. Il conserve ses données dans des tables
classiques, rangées dans son schéma `achievements` : `player_stats` (les compteurs de chaque
joueur : expéditions, or, améliorations, niveau de chaque bâtiment, compagnons, offres) et
trois tables de passage, retenues jusqu'à la fin de ce qu'elles décrivent : `game_players` (les
joueurs d'une expédition), `games` (sa difficulté et son nombre de compagnons) et `offers` (le
vendeur d'une offre du Marché).

Ces tables sont tenues à jour par une projection, rattrapée à la lecture (ADR 0006). Sa version
est passée de 1 à 4 à mesure que des compteurs s'ajoutaient (bâtiments, compagnons, Marché), ce
qui la fait reconstruire depuis le journal. Les hauts faits eux-mêmes ne sont pas stockés : la
fonction pure `evaluate` les calcule à chaque lecture à partir des compteurs. Les migrations
`0013` à `0016` créent les tables et les colonnes, et ne touchent à aucune table d'un autre
module.

## Conséquences

### Positives

- Tout se reconstruit depuis le journal : un compteur faux se corrige en augmentant la
  version de la projection.
- Aucun chemin d'écriture à protéger : le module ne peut pas être utilisé pour tricher.
- Ajouter un haut fait ou changer un seuil ne demande aucune migration, puisque seuls les
  compteurs sont stockés.
- Un haut fait obtenu n'est jamais retiré : les compteurs ne font que croître.

### Négatives

- La date d'obtention d'un haut fait n'est pas conservée : elle n'existe que dans le calcul.
- Cohérence à terme : les compteurs peuvent avoir quelques secondes de retard sur le jeu.
- Le module dépend du langage publié du Donjon, du Village et du Marché : un événement renommé
  ou modifié sans réexamen de ses lecteurs ferait dériver les compteurs sans signal d'erreur.
- Les tables `game_players`, `games` et `offers` reproduisent un état que d'autres modules
  détiennent, et que ce module n'a pas le droit de lire.
- Chaque nouveau compteur demande une colonne, une migration et une nouvelle version de la
  projection, qui se reconstruit alors depuis le journal.
- La première lecture après la création des tables rejoue tout le journal.

## Alternatives écartées

- **Journal d'événements propre au module** : il n'aurait rien à enregistrer, puisque le
  module ne reçoit aucune commande, et il recopierait ce que les autres modules ont déjà
  écrit.
- **Table des hauts faits obtenus, écrite à chaque événement** : elle garderait la date
  d'obtention, mais elle ajouterait un état à synchroniser, et un changement de seuil exigerait
  une migration des données.
- **Calculer chaque lecture en rejouant le journal** : le coût de chaque consultation croîtrait
  avec l'historique du jeu, comme pour la liste des expéditions ouvertes (dette DT-005).

## Réexamen

À revoir si les joueurs doivent voir la date d'obtention d'un haut fait, ou recevoir une
notification au moment où ils l'obtiennent : il faudra alors stocker les hauts faits obtenus.
À revoir aussi si la reconstruction de la projection approche la durée maximale d'une
fonction.

## Usage de l'IA générative

J'ai choisi l'idée du module et validé sa conception avec Claude Code. Claude Code a proposé
le code du module et rédigé cet ADR. Relu par moi et comparé au code.
