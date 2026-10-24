# ADR-0005 - Intelligence artificielle déterministe, sans tâche de fond

- Statut : accepté
- Date : 2026-10-21

## Contexte

Les monstres doivent se comporter selon un niveau de difficulté, et des compagnons doivent
permettre de jouer seul. L'hébergement ne permet aucun processus permanent (ADR 0004).

Une expédition est reconstruite à partir de ses événements, et une manche peut être calculée
pendant une lecture sans être enregistrée (ADR 0002 et 0004).

## Décision

Les décisions de l'IA sont des fonctions pures du domaine, appelées quand une manche est
résolue. Elles ne tirent au sort qu'avec le générateur de la manche. Leurs résultats, actions
des compagnons comprises, sont enregistrés dans l'événement `RoundResolved`.

Le comportement des monstres est isolé derrière un port de stratégie, que chaque niveau de
difficulté implémente. Un compagnon n'agit que si au moins un joueur a choisi une action
pour la manche.

L'équilibre du jeu est mesuré par simulation et protégé par des tests statistiques.

## Conséquences

### Positives

- L'IA est testable comme n'importe quelle fonction : même entrée, même sortie.
- Aucun processus de fond : l'IA agit seulement quand une manche est résolue.
- Ajouter une difficulté, c'est ajouter une stratégie, sans toucher au reste.
- Les actions des compagnons sont dans le journal : rejouer une expédition donne le même
  résultat.

### Négatives

- Un personnage piloté par l'ordinateur ne peut pas agir entre deux échéances.
- La qualité de l'équilibre dépend de la règle suivie par les joueurs simulés, qui reste une
  approximation de vrais joueurs.
- Un compagnon ne joue jamais seul : sans joueur actif, la manche ne l'attend pas.
- Changer le comportement de l'IA ne change pas les parties déjà enregistrées.

## Alternatives écartées

- **Boucle de jeu dans un processus permanent** : impossible sur l'hébergement sans serveur.
- **Décisions prises par le navigateur d'un joueur** : un joueur pourrait les modifier, et
  chaque joueur verrait un résultat différent.
- **Recalculer les décisions à la relecture plutôt que les enregistrer** : un changement de
  stratégie modifierait le passé, et les expéditions déjà jouées ne se rejoueraient plus
  pareil.

## Réexamen

À revoir si le jeu a besoin de personnages qui agissent en dehors des manches, ou si
l'équilibre mesuré par simulation s'écarte nettement de celui des vrais joueurs.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD7 et du code. Relu par moi et
comparé au code.
