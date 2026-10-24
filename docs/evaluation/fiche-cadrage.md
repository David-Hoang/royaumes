# Fiche de cadrage : Hauts faits

- Auteur : David Hoang
- Date : 2026-10-24
- Nom technique du module : `achievements`

## L'idée

Le joueur gagne automatiquement des hauts faits (distinctions) quand il atteint certains
seuils dans le jeu : victoires au Donjon, améliorations du Village, or rapporté. Il les consulte sur une page dédiée, avec sa progression vers ceux qu'il n'a pas encore.
Les hauts faits non obtenus sont affichés grisés, avec leur progression. 
Cela donne des objectifs à long terme sans rien changer aux règles des autres modules.
Le catalogue est extensible : ajouter un haut fait, ou un compteur issu d'un futur module, revient à ajouter une entrée dans le catalogue, sans toucher aux règles.

## Les règles métier

1. Un haut fait est défini par un compteur (victoires, expéditions jouées, améliorations,
   or rapporté) et un seuil.
2. Un joueur obtient un haut fait dès que son compteur atteint le seuil.
3. Un haut fait obtenu n'est jamais retiré, car les compteurs ne font que croître.
4. Un haut fait n'est attribué qu'une fois par joueur.
5. La progression d'un haut fait non obtenu est le compteur sur le seuil, plafonnée au seuil.
6. Un joueur ne voit que ses propres hauts faits.

## Les commandes et les lectures

| Action du joueur | Commande ou lecture | Route envisagée |
| --- | --- | --- |
| Consulter ses hauts faits et sa progression | Lecture | `GET /api/achievements` |

Le module n'a aucune commande : les hauts faits sont déduits des actions faites dans les
autres modules.

## Le stockage envisagé

Tables classiques dans le schéma `achievements`, tenues par une projection. Les données sont
dérivées du journal des autres modules et peuvent être reconstruites : un journal propre au
module n'apporterait rien.

## La communication avec les modules existants

Lecture du langage publié du Donjon (`GameEnded`, `PlayerJoined`) et du Village
(`BuildingUpgraded`), par la projection, comme le Classement. Le sens est à sens unique : le
module lit, il n'écrit chez personne.

## Les données personnelles

Les compteurs d'un joueur, rattachés à son identifiant. Le contributeur `personal-data.ts`
les exporte et les efface avec le compte.

## Les bonus visés

Par ordre de priorité :

1. B4 : modèle de lecture tenu par une projection, avec point de reprise et version.
2. B6 : communication avec deux modules existants (Donjon et Village).
3. B1 : canal temps réel propre au module, pour annoncer un haut fait débloqué.
4. B8 : fonction d'aptitude protégeant une propriété du module.
