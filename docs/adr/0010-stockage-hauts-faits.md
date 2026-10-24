# ADR-0010 - Tables de lecture tenues par une projection pour les Hauts faits

- Statut : accepté
- Date : 2026-10-24

## Contexte

Les Hauts faits récompensent des actions faites dans le Donjon et le Village. Le module n'a
aucune commande : le joueur ne fait rien d'autre que consulter sa progression. Tout ce qu'il
affiche se déduit d'événements que d'autres modules ont déjà écrits dans le journal.

Les données du module sont des compteurs rattachés à un joueur. Elles doivent pouvoir être
exportées et effacées avec son compte (ADR 0008). L'hébergement ne permet aucun processus
permanent (ADR 0004).

## Décision

Le module n'a pas de journal d'événements propre. Il conserve ses données dans des tables
classiques, rangées dans son schéma `achievements` : `player_stats` (les compteurs de chaque
joueur) et `game_players` (les joueurs d'une expédition, retenus jusqu'à sa fin).

Ces tables sont tenues à jour par une projection (version 1), rattrapée à la lecture
(ADR 0006). Les hauts faits eux-mêmes ne sont pas stockés : la fonction pure `evaluate` les
calcule à chaque lecture à partir des compteurs. La migration `0013_achievements.sql` crée
les tables et ne touche à aucune table d'un autre module.

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
- Le module dépend du langage publié du Donjon et du Village : un événement renommé ou
  modifié sans réexamen de ses lecteurs ferait dériver les compteurs sans signal d'erreur.
- La table `game_players` reproduit celle du Classement, que le module n'a pas le droit de
  lire.
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
