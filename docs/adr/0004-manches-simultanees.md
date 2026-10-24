# ADR-0004 - Manches simultanées et échéances paresseuses pour le Donjon

- Statut : accepté
- Date : 2026-10-20

## Contexte

Les combats réunissent jusqu'à 4 joueurs, qui ne doivent ni s'attendre indéfiniment ni être
avantagés par l'ordre de jeu. Leurs choix doivent rester secrets jusqu'à la résolution.

L'hébergement n'offre ni minuteur en mémoire ni tâche de fond, et les tâches planifiées de
l'offre gratuite ne tournent qu'une fois par jour. L'état d'une expédition est reconstruit à
partir de ses événements (ADR 0002) : tout calcul doit donc être reproductible.

## Décision

Les héros choisissent en même temps. La manche est résolue quand tous ont choisi, ou à son
échéance de 30 s (`ROUND_MS`) ; un héros sans choix se défend.

L'échéance est enregistrée dans les événements, et une manche échue est résolue à l'instant
de son échéance. Une lecture calcule la résolution des manches échues sans rien enregistrer ;
toute commande commence par l'enregistrer. Le navigateur envoie une commande d'échéance
quand son compte à rebours arrive à zéro.

Le hasard est tiré dans `decide` avec un générateur à graine dérivée du numéro de manche, et
les résultats sont enregistrés. Une action porte le numéro de la manche visée et est refusée
si cette manche est déjà résolue.

## Conséquences

### Positives

- Personne n'attend l'autre et l'ordre de jeu n'avantage personne.
- Aucun minuteur ni tâche de fond : tout est déduit des horodatages enregistrés.
- Le hasard est reproductible, donc les tests et le rejeu donnent toujours le même résultat.
- Les choix restent secrets jusqu'à la résolution.

### Négatives

- Si plus aucun joueur ne se manifeste, le journal reste en retard sur ce que montreraient
  les lectures : la fin d'une expédition abandonnée n'est jamais enregistrée.
- La résolution dépend des navigateurs, qui doivent envoyer la commande d'échéance.
- Une lecture recalcule des manches sans les enregistrer, ce qui ajoute du calcul.
- Une action arrivée trop tard est refusée, ce qui peut surprendre le joueur.

## Alternatives écartées

- **Tour par tour strict** : les joueurs s'attendent, et un joueur absent bloque la partie.
- **Minuteur ou tâche planifiée** : impossible sans processus permanent, et une tâche par
  jour est bien trop lente pour des manches de 30 s.
- **Lecture qui enregistre la résolution** : une lecture modifierait les données, avec des
  risques de conflits entre lectures simultanées.
- **`Math.random` avec seul le résultat enregistré** : la décision ne serait plus
  reproductible, donc plus testable.

## Réexamen

À revoir s'il faut enregistrer la fin d'une expédition abandonnée, ou si un service de
planification de tâches compatible avec l'hébergement devient disponible.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD6 et du code. Relu par moi et
comparé au code.
