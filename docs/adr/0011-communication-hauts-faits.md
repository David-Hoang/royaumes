# ADR-0011 - Lecture du langage publié du Donjon et du Village par les Hauts faits

- Statut : accepté
- Date : 2026-10-24

## Contexte

Les Hauts faits dépendent de deux modules existants : le Donjon (expéditions jouées, gagnées,
or rapporté) et le Village (améliorations de bâtiments). Le module ne leur envoie rien : il
ne fait que lire ce qui s'y est passé.

Les modules ne doivent pas écrire dans les données les uns des autres (TD2), et la partie 4.2
du TD final demande de modifier le moins possible les modules existants. Le Classement
résout déjà le même besoin en lisant le journal (ADR 0006).

## Décision

Le module communique par la lecture du langage publié, et non par des messages de la boîte
d'envoi. Sa projection lit dans le journal quatre types d'événements : `GameCreated`,
`PlayerJoined`, `GameEnded` (Donjon) et `BuildingUpgraded` (Village). Elle ne décrit que les
champs utiles de chacun, et obtient les préfixes de leurs flux par les `contracts.ts` du
Donjon et du Village, sans importer aucun fichier interne.

La communication est à sens unique : le module lit et n'écrit chez personne, donc il ne
modifie ni le Donjon ni le Village. Chaque événement est appliqué une fois : la projection
l'applique et avance son point de reprise dans la même transaction (ADR 0006).

Les navigateurs sont prévenus par un canal temps réel propre au module, global et discret :
il annonce la position des événements appliqués, jamais leur contenu.

## Conséquences

### Positives

- Les modules existants ne changent pas : ni code, ni contrats, ni migration.
- Aucune panne d'un module ne peut en bloquer un autre : il n'y a pas d'appel entre eux.
- Pas de gestionnaire de messages à écrire idempotent : le point de reprise de la
  projection garantit qu'un événement n'est pas compté deux fois.
- Les compteurs du passé se calculent sans rien changer aux modules qui les alimentent.

### Négatives

- Le module est couplé à la forme des événements des autres : un événement renommé ou
  modifié sans réexamen de ses lecteurs fausse les compteurs sans signal d'erreur.
- `GameEnded` ne dit pas quels joueurs ont participé : le module doit retenir les joueurs de
  chaque expédition dans une table à part (`game_players`).
- La cohérence est différée : un haut fait peut apparaître quelques secondes après l'action,
  le temps que la projection rattrape le journal.
- Le canal annonce tous les événements lus, y compris ceux d'autres joueurs, ce qui fait
  relire la liste inutilement.

## Alternatives écartées

- **Messages de la boîte d'envoi** (ADR 0007) : ils garantiraient une livraison au moins une
  fois, mais exigeraient que le Donjon et le Village envoient un message à chaque action, donc
  de les modifier, et d'écrire des gestionnaires idempotents. C'est trop lourd pour un module
  qui ne fait que lire.
- **Appeler directement les services du Donjon et du Village** : cela créerait un
  couplage entre modules, une panne en cascade, et un coût qui croîtrait avec le nombre de
  joueurs.
- **Importer des fichiers internes des autres modules** : interdit par les règles
  d'encapsulation, vérifiées par dependency-cruiser.

## Réexamen

À revoir si un haut fait doit déclencher une action dans un autre module, par exemple
attribuer une récompense : la communication devient alors une écriture, qui demande une saga
et la boîte d'envoi (ADR 0007). À revoir aussi si le langage publié du Donjon ou du Village
change de forme.

## Usage de l'IA générative

J'ai choisi l'idée du module et validé sa conception avec Claude Code. Claude Code a proposé
le code du module et rédigé cet ADR. Relu par moi et comparé au code.
