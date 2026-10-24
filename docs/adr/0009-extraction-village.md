# ADR-0009 - Extraction du Village en service autonome, préparée mais non déployée

- Statut : accepté
- Date : 2026-10-23

## Contexte

L'ADR 0001 promettait des frontières assez strictes pour qu'un module puisse être extrait.
Les raisons d'extraire un module (TD11, 1.3) ne s'appliquent aujourd'hui à aucun module du
jeu.

Le Village a des dépendances qui ne passent pas par le code : le Classement et le canal temps
réel lisent ses événements directement dans le journal commun.

## Décision

Le Village peut tourner dans un service autonome, avec sa propre base, son propre journal et
sa propre boîte d'envoi. L'application devient une passerelle : elle utilise une version
distante du module Village, de même forme que celle exécutée dans le processus
(`remote.ts`).

Les messages de la saga franchissent la frontière par une boîte de réception, sans changer les
garanties de la boîte d'envoi. Un relais recopie le flux d'événements publié par le service
dans le journal de l'application, où le Classement et le canal temps réel continuent de le
lire. Les échanges entre les deux processus sont authentifiés par un secret partagé, jamais
versionné.

Le service n'est pas déployé : en production, le Village tourne dans l'application.

## Conséquences

### Positives

- Les frontières sont démontrées, et non plus supposées.
- Six tests de contrat vérifient ces frontières à chaque construction.
- L'extraction est réversible, sans migration de données.
- La boîte de réception et l'authentification entre services servent pour tout autre module.
- On connaît le coût réel d'une extraction.

### Négatives

- Il y a deux chemins d'exécution du Village à maintenir : dans le processus, et à distance.
- Les événements du Village sont copiés dans le journal de l'application, avec une
  cohérence différée.
- Des dettes sont à rembourser avant tout déploiement du service (voir le registre de dette).
- Avec un secret partagé, une fuite permettrait de se faire passer pour n'importe quel
  joueur auprès du service.

## Alternatives écartées

- **Déployer le service** : aucun besoin réel, et un second déploiement à surveiller sur
  l'offre gratuite.
- **Ne pas extraire** : les frontières resteraient une hypothèse jamais vérifiée.
- **Lecture à distance du flux publié par le Classement et le canal temps réel** : ils
  dépendraient du réseau pour lire, et il faudrait les réécrire.
- **Extraire le Marché à la place** : sa saga lie son sort à celui du Village.
- **Jeton signé ou TLS mutuel** : plus sûrs que le secret partagé, mais plus coûteux à
  mettre en place pour un service non déployé.

## Réexamen

À revoir si le test de charge du Village dépasse le budget alors que les autres modules le
respectent, si une seconde équipe prend en charge le Village, ou si le Village doit être
déployé plus souvent que le reste du jeu.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD11 et du code. Relu par moi et
comparé au code.
