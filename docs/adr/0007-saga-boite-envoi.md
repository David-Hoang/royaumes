# ADR-0007 - Saga orchestrée et boîte d'envoi transactionnelle pour les opérations entre modules

- Statut : accepté
- Date : 2026-10-21

## Contexte

Un échange du Marché modifie les données du Marché et celles de deux villages, et ne doit ni
créer ni perdre de ressources. Les modules ne doivent pas écrire dans les données des autres
(TD2), et un module pourra être extrait dans un service avec sa propre base (TD11).
L'hébergement ne permet aucun processus permanent (ADR 0004).

## Décision

Une transaction ne modifie jamais les données que d'un seul module. Une opération qui en
touche plusieurs est une saga, dont on identifie les étapes compensables, le pivot et les
reprises jusqu'au succès.

La saga est orchestrée par le module qui porte l'opération (le Marché). Les participants ne
la connaissent pas : ils répondent à l'adresse de retour indiquée dans chaque demande.

Les messages sont enregistrés dans la boîte d'envoi de la plateforme, dans la même
transaction que les événements qui les déclenchent. La distribution est garantie au moins
une fois : bail, nouvel essai avec recul exponentiel, abandon après 10 tentatives. Chaque
gestionnaire est idempotent grâce à une clé choisie par le demandeur.

La distribution a lieu après chaque commande et chaque consultation du Marché, et chaque
jour par une tâche planifiée protégée par un secret.

## Conséquences

### Positives

- Aucun module n'écrit dans les données d'un autre.
- Une panne à n'importe quel moment ne perd ni ne duplique de ressources.
- Le Village peut servir d'autres demandeurs sans modification.
- La boîte d'envoi sert aussi de minuterie.
- Le déroulement de la saga se lit en un seul endroit.

### Négatives

- Des états intermédiaires sont visibles des joueurs, comme une offre en règlement.
- La latence dépend de l'activité : une saga interrompue ne reprend qu'à la consultation
  suivante du Marché, ou le lendemain.
- Les gestionnaires doivent être idempotents, et leurs doublons testés.
- Des messages peuvent être abandonnés ; ils sont examinables avec `scripts/dead-letters.ts`
  (dette DT-007, remboursée au TD11), mais la relance reste manuelle.
- La table de la boîte d'envoi grandit sans limite, les messages traités étant conservés.

## Alternatives écartées

- **Une transaction unique sur les données des deux modules** : elle romprait
  l'encapsulation et empêcherait toute extraction.
- **Transaction distribuée (validation en deux phases)** : lourde, mal supportée par
  l'hébergement, et inutile quand tout est dans une seule base.
- **Appel direct du Village par le Marché, sans boîte d'envoi** : une panne entre les deux
  étapes perdrait ou dupliquerait des ressources.
- **Saga chorégraphiée** : le déroulement serait réparti entre les modules, difficile à lire
  et à tester.
- **Journal d'événements utilisé comme boîte d'envoi** : il n'a ni bail, ni nouvel essai, ni
  suivi des échecs.

## Réexamen

À revoir si un module est extrait dans un service distinct (une boîte d'envoi par base et un
transport entre services), si le volume de messages justifie un courtier dédié, ou si la
distribution déclenchée par les requêtes devient trop lente.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD9 et du code. Relu par moi et
comparé au code.
