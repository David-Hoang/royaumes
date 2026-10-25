# Fiche de cadrage : Hauts faits

- Auteur : David Hoang
- Date : 2026-10-24
- Dernière mise à jour : 2026-10-25 (séries de paliers, bâtiments, compagnons et Marché)
- Nom technique du module : `achievements`

## L'idée

Le joueur gagne automatiquement des hauts faits (distinctions) quand il atteint certains
seuils dans le jeu : victoires et or rapporté au Donjon, expéditions gagnées avec des
compagnons, niveau de chaque bâtiment du Village, offres publiées et conclues au Marché. Il les
consulte sur une page dédiée, rangés par thème (Village, Donjon, Marché), avec sa progression
vers ceux qu'il n'a pas encore.
Les hauts faits non obtenus sont affichés grisés, avec leur progression. Ceux qui mesurent le
même compteur à des paliers croissants sont réunis en une série, dans une seule carte (par
exemple les trois paliers de la scierie). Un haut fait obtenu depuis la dernière visite est
signalé « Nouveau ! », et la page propose un prochain objectif.
Cela donne des objectifs à long terme sans rien changer aux règles des autres modules.
Le catalogue est extensible : ajouter un haut fait, ou un compteur issu d'un futur module, revient à ajouter une entrée dans le catalogue, sans toucher aux règles.

## Les règles métier

1. Un haut fait est défini par un compteur (victoires, expéditions jouées, améliorations,
   or rapporté, niveau de chaque bâtiment, compagnons d'une expédition gagnée par difficulté,
   offres publiées, offres conclues) et un seuil.
2. Un joueur obtient un haut fait dès que son compteur atteint le seuil.
3. Un haut fait obtenu n'est jamais retiré, car les compteurs ne font que croître.
4. Un haut fait n'est attribué qu'une fois par joueur.
5. La progression d'un haut fait non obtenu est le compteur sur le seuil, plafonnée au seuil.
6. Un joueur ne voit que ses propres hauts faits.
7. Chaque haut fait appartient à un thème ; la page présente les thèmes dans un ordre fixe,
   sans thème vide.
8. Les hauts faits qui mesurent le même compteur à des paliers croissants forment une série,
   dont les paliers sont présentés du plus bas au plus haut.
9. La page signale les hauts faits obtenus depuis la dernière visite du joueur, et propose
   comme prochain objectif le haut fait non obtenu le plus avancé.
10. Un échange conclu est attribué au vendeur de l'offre, et une offre retirée n'est jamais
    comptée comme conclue.

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

Lecture du langage publié de trois modules par la projection, comme le Classement : le
Donjon (`GameCreated`, `PlayerJoined`, `CompanionAdded`, `GameEnded`), le Village
(`BuildingUpgraded`) et le Marché (`OfferPublished`, `TradeCompleted`, `OfferWithdrawn`). Le
sens est à sens unique : le module lit, il n'écrit chez personne.

## Les données personnelles

Les compteurs d'un joueur, rattachés à son identifiant, et, le temps que l'offre se termine,
l'identifiant du vendeur de chacune de ses offres en cours. Le contributeur `personal-data.ts`
exporte les compteurs et efface le tout avec le compte.

## Les bonus visés

Par ordre de priorité :

1. B4 : modèle de lecture tenu par une projection, avec point de reprise et version.
2. B6 : communication avec au moins deux modules existants (Donjon, Village et Marché).
3. B1 : canal temps réel propre au module, pour annoncer un haut fait débloqué.
4. B9 : interface graphique avec un effet marquant (animation des hauts faits nouveaux).
5. B8 : fonction d'aptitude protégeant une propriété du module.
