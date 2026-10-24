# ADR-0008 - Stockage classique pour la Taverne, et réécriture ciblée du journal pour l'effacement

- Statut : accepté
- Date : 2026-10-21

## Contexte

La Taverne contient des messages et une présence faits pour disparaître. Les joueurs ont des
droits d'accès, de portabilité et d'effacement sur le jeu entier.

Des noms de joueurs sont déjà copiés dans les événements du Donjon et du Marché, et un nom de
village dans ceux du Village, dans des flux parfois partagés avec d'autres joueurs. Le journal
est en ajout seul (ADR 0002) et des projections en dépendent (ADR 0006).

## Décision

La Taverne utilise des tables ordinaires, dont les lignes sont supprimées à la fin de leur
durée de conservation. Son canal temps réel est alimenté par une source fournie par le
module. La présence repose sur un signal périodique : une ligne par joueur présent, supprimée
à son départ ou 2 minutes après son dernier signal. Les durées de conservation sont
appliquées à la lecture, et chaque jour par la tâche quotidienne.

Chaque module déclare ses données personnelles par un contributeur (`personal-data.ts`) :
export, réécriture de ses événements, effacement de ses tables. L'effacement réécrit les seuls
champs de nom des événements du joueur, par une fonction unique de la plateforme, et le note
dans un registre qui ne contient aucune donnée sur le joueur. L'identité est effacée en
dernier, et chaque étape est idempotente.

## Conséquences

### Positives

- Le joueur exerce lui-même ses droits, sans intervention.
- L'effacement ne modifie ni les états reconstruits ni l'historique des autres joueurs.
- La durée de conservation est respectée même sans activité.
- La Taverne est plus simple que si elle avait suivi le modèle des autres modules.

### Négatives

- C'est une exception à la règle de l'ajout seul : toute modification future du journal devra
  la respecter strictement.
- L'export et l'effacement coûtent de plus en plus cher quand le journal grossit.
- Chaque nouvel événement doit déclarer ses champs personnels dans le contributeur de son
  module, sinon ils échapperont à l'effacement.
- Un identifiant reste dans le journal : la pseudonymisation n'est réelle que si tout lien
  avec la personne est vraiment détruit.

## Alternatives écartées

- **Event Sourcing pour la Taverne** : un historique sans fin pour des données faites pour
  disparaître.
- **Supprimer les flux du joueur** : cela casserait les états et les flux partagés avec
  d'autres joueurs.
- **Effacement cryptographique** (jeter la clé de chiffrement) : de la gestion de clés en
  plus pour un projet de cette taille.
- **Références sans copie** (ne mettre que l'identifiant dans les événements) : meilleure
  solution à l'origine, mais il aurait fallu changer des événements déjà écrits.
- **Service externe de présence** (base clé-valeur en mémoire) : une infrastructure de plus
  sur l'offre gratuite.

## Réexamen

À revoir pour tout nouveau module, où les références sans copie devraient être préférées dès
le départ, si le journal devient assez gros pour que l'effacement soit trop long pour une
requête, ou si la doctrine sur l'anonymisation des identifiants pseudonymes évolue.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD10 et du code. Relu par moi et
comparé au code.
