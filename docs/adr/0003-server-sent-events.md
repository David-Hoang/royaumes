# ADR-0003 - Server-Sent Events, alimentés par le journal, pour le temps réel

- Statut : accepté
- Date : 2026-10-20

## Contexte

Les joueurs doivent voir les changements sans recharger la page : d'abord entre les onglets
d'un même joueur, puis entre les participants d'une partie du Donjon (TD6). Leurs actions
passent déjà par l'API en requêtes HTTP authentifiées.

Contraintes de Vercel : durée d'exécution d'une fonction limitée, plusieurs instances sans
mémoire partagée, offre gratuite sans infrastructure en plus. Côté données, le journal
d'événements a déjà des versions croissantes par flux (ADR 0002).

## Décision

Les changements sont envoyés par Server-Sent Events, sur `/api/stream/<canal>`. Un canal
correspond à un flux du journal, et l'identifiant de chaque message est la version de
l'événement : le navigateur reprend où il en était grâce à `Last-Event-ID`.

Le serveur relit le journal toutes les 500 ms (`pollMs`), envoie un `: ping` pour garder la
connexion, et ferme le flux après 240 s (`maxStreamMs`) ; le navigateur se reconnecte seul.

L'accès est réservé aux joueurs connectés. Chaque module déclare sa règle d'accès
(`ChannelPolicy`) et un canal sans règle est refusé. L'interface relit sa vue à chaque
notification plutôt que d'appliquer elle-même les événements.

## Conséquences

### Positives

- Pas de service en plus : tout passe par une route HTTP de l'application.
- Le journal est la seule source, donc rien à synchroniser entre instances.
- La reprise est gratuite : `EventSource` se reconnecte et `Last-Event-ID` évite les trous.
- La sécurité est centralisée : les règles d'accès sont déclarées par module.

### Négatives

- Chaque joueur connecté fait environ 2 lectures du journal par seconde.
- Un événement peut arriver avec jusqu'à 500 ms de retard.
- Le flux se coupe toutes les 240 s, ce qui crée des reconnexions régulières.
- La communication ne va que du serveur vers le navigateur ; le reste passe par l'API.

## Alternatives écartées

- **WebSocket** : pas adaptés aux fonctions serverless à durée limitée, et plus lourds à
  authentifier et à relancer qu'un flux HTTP simple.
- **Interrogation périodique par le navigateur** : elle multiplie les requêtes complètes
  (authentification comprise) et le délai dépend de la fréquence choisie.
- **`LISTEN/NOTIFY` ou service de messagerie** : une infrastructure en plus à faire tenir
  sur l'offre gratuite, alors que le journal fait déjà le travail.

## Réexamen

À revoir si le nombre de joueurs connectés fait peser les lectures sur la base, si un besoin
de communication rapide du navigateur vers le serveur apparaît, ou si l'hébergeur prend en
charge les WebSocket de façon stable.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD5 et du code. Relu par moi et
comparé au code.
