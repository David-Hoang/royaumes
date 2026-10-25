# ADR-0011 - Lecture du langage publié du Donjon, du Village et du Marché par les Hauts faits

- Statut : accepté
- Date : 2026-10-24
- Mise à jour : 2026-10-25 (le Marché est lu en plus ; la décision est inchangée)

## Contexte

Les Hauts faits dépendent de trois modules existants : le Donjon (expéditions jouées, gagnées,
compagnons, or rapporté), le Village (niveau des bâtiments) et le Marché (offres publiées et
conclues). Le module ne leur envoie rien : il ne fait que lire ce qui s'y est passé.

Les modules ne doivent pas écrire dans les données les uns des autres (TD2), et la partie 4.2
du TD final demande de modifier le moins possible les modules existants. Le Classement
résout déjà le même besoin en lisant le journal (ADR 0006).

## Décision

Le module communique par la lecture du langage publié, et non par des messages de la boîte
d'envoi. Sa projection lit dans le journal huit types d'événements : `GameCreated`,
`PlayerJoined`, `CompanionAdded` et `GameEnded` (Donjon), `BuildingUpgraded` (Village),
`OfferPublished`, `TradeCompleted` et `OfferWithdrawn` (Marché). Elle ne décrit que les champs
utiles de chacun, et obtient les préfixes de leurs flux par les `contracts.ts` du Donjon, du
Village et du Marché, sans importer aucun fichier interne.

La communication est à sens unique : le module lit et n'écrit chez personne, donc il ne
modifie aucun de ces trois modules. Chaque événement est appliqué une fois : la projection
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
- Certains événements sont incomplets pour ce besoin : `GameEnded` ne dit ni les joueurs, ni
  la difficulté, ni les compagnons, et `TradeCompleted` ne dit pas le vendeur. Le module doit
  retenir ces informations dans des tables de passage (`game_players`, `games`, `offers`).
- La cohérence est différée : un haut fait peut apparaître quelques secondes après l'action,
  le temps que la projection rattrape le journal.
- Le canal annonce tous les événements lus, y compris ceux d'autres joueurs, ce qui fait
  relire la liste inutilement.

## Alternatives écartées

- **Messages de la boîte d'envoi** (ADR 0007) : ils garantiraient une livraison au moins une
  fois, mais exigeraient que le Donjon, le Village et le Marché envoient un message à chaque
  action, donc de les modifier, et d'écrire des gestionnaires idempotents. C'est trop lourd
  pour un module qui ne fait que lire.
- **Appeler directement les services de ces modules** : cela créerait un
  couplage entre modules, une panne en cascade, et un coût qui croîtrait avec le nombre de
  joueurs.
- **Importer des fichiers internes des autres modules** : interdit par les règles
  d'encapsulation, vérifiées par dependency-cruiser.

## Réexamen

À revoir si un haut fait doit déclencher une action dans un autre module, par exemple
attribuer une récompense : la communication devient alors une écriture, qui demande une saga
et la boîte d'envoi (ADR 0007). À revoir aussi si le langage publié du Donjon, du Village ou
du Marché change de forme.

## Usage de l'IA générative

J'ai choisi l'idée du module et validé sa conception avec Claude Code. Claude Code a proposé
le code du module et rédigé cet ADR. Relu par moi et comparé au code.
