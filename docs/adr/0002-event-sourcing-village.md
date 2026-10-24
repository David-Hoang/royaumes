# ADR-0002 - Event Sourcing pour le Village

- Statut : accepté
- Date : 2026-10-20

## Contexte

Le village d'un joueur change au fil de ses actions, et l'historique compte dans le jeu.
La suite du projet en a besoin : temps réel (TD5) et classement (TD8). De plus, sur Vercel,
deux instances peuvent traiter en même temps deux requêtes pour le même village.

## Décision

L'état du village n'est pas stocké : on le recalcule en rejouant ses événements. Ils sont
rangés dans le journal `platform.events` (ajout seul), un flux par village.

Les écritures simultanées sont repérées par la contrainte d'unicité `events_stream_version`
(flux, version). En cas de conflit (`ConcurrencyError`), la commande est rejouée, 3 fois
maximum. Chaque événement contient tout ce qu'il faut pour être rejoué (par exemple le coût
payé).

## Conséquences

### Positives

- Tout l'historique est gardé.
- Le journal sert de source au temps réel et aux projections.
- Pas de verrou : la base repère elle-même les conflits.

### Négatives

- Un événement écrit ne se modifie plus : changer le format demande de gérer les anciens.
- Lire un village oblige à rejouer tout son historique, sans instantanés.
- Une commande peut échouer après 3 essais si le village est très sollicité.

## Alternatives écartées

- **Table d'état classique** : l'historique est écrasé, et le temps réel et le classement
  demanderaient un autre mécanisme.
- **Verrou pessimiste** (`SELECT ... FOR UPDATE`) : il bloque les requêtes concurrentes, ce
  qui passe mal avec des instances serverless.

## Réexamen

À revoir si les historiques deviennent trop longs à rejouer (instantanés), ou si un format
d'événement change de façon incompatible.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD3 et du code. Relu par moi et
comparé au code.
