# Rendu de l'évaluation

- Auteur : David Hoang
- Module : `achievements`
- Adresse du déploiement : https://royaumes-umber.vercel.app/
- Fiche de cadrage : [fiche-cadrage.md](fiche-cadrage.md)

## Exigences minimales

| N° | Fichiers principaux | Tests qui la vérifient |
| --- | --- | --- |
| E1 | `src/modules/achievements/` : `domain/`, `application/`, `infrastructure/`, `api.ts`, `index.ts`, `contracts.ts`, `ui.tsx` | `src/bootstrap/architecture.test.ts`, `pnpm lint:archi` |
| E2 | `src/bootstrap/create-api.ts`, `app/(jeu)/achievements/page.tsx`, `src/ui/app-shell.tsx` | `src/bootstrap/achievements-api.test.ts` (le module est assemblé par `createApi`) |
| E3 | `domain/catalog.ts`, `domain/achievements.ts` | `domain/achievements.test.ts` (règles 1 à 5, 7, 8 et 9 de la fiche) |
| E4 | `infrastructure/schema.ts` (schéma `achievements`), `drizzle/0013_achievements.sql` à `drizzle/0016_achievements-marche.sql` | `src/bootstrap/architecture.test.ts` (chaque table dans un schéma propre), `infrastructure/achievements-projection.test.ts` |
| E5 | `api.ts`, `src/bootstrap/create-api.ts` (`requireUser` sur `/achievements` et `/achievements/*`) | `achievements-api.test.ts` : « refuse une requête anonyme (401) » et « ne présente à un joueur que ses propres hauts faits » (règle 6). La route n'accepte aucune entrée à valider |
| E6 | `infrastructure/achievements-projection.ts` (lit `GameCreated`, `PlayerJoined`, `CompanionAdded`, `GameEnded` du Donjon, `BuildingUpgraded` du Village, `OfferPublished`, `TradeCompleted`, `OfferWithdrawn` du Marché) | `infrastructure/achievements-projection.test.ts`, `achievements-api.test.ts` |
| E7 | `personal-data.ts` (export et effacement ; le module n'a pas d'événements propres à réécrire) | `personal-data.test.ts`, `architecture.test.ts` (déclaration des données personnelles) |
| E8 | Toutes les règles de la fiche et la route `GET /api/achievements` | Règles 1 à 5, 7, 8 et 9 : `domain/achievements.test.ts` ; règle 6 : `application/achievements-service.test.ts` et `achievements-api.test.ts` ; règle 10 : `infrastructure/achievements-projection.test.ts` ; route : `achievements-api.test.ts` (4 tests) |
| E9 | `.dependency-cruiser.cjs` et `architecture.test.ts` inchangés depuis `td11-fin` | `pnpm verify` : 0 violation |
| E10 | Migrations `drizzle/0013` à `0016` appliquées par `vercel-build` | Parcours sur le déploiement : page `/achievements`, export et suppression d'un compte de test |

## Bonus revendiqués

| N° | Description | Fichiers | Tests | Documentation |
| --- | --- | --- | --- | --- |
| B1 | Canal temps réel propre au module (`achievements`), global et discret, avec sa règle d'accès | `index.ts` (`channelPolicy`), `contracts.ts`, `ui.tsx` | `achievements-api.test.ts` : « annonce sur son canal les événements lus, sans leurs données » | README (Temps réel), `docs/architecture.md`, ADR 0011 |
| B4 | Modèle de lecture tenu par une projection, avec son point de reprise et sa version | `infrastructure/achievements-projection.ts` (version 4, après trois évolutions), `infrastructure/drizzle-stats-reader.ts` | `infrastructure/achievements-projection.test.ts`, `personal-data.test.ts` (rattrapage avant l'effacement) | ADR 0010, `docs/architecture.md`, README |
| B6 | Communication avec trois modules existants : le Donjon, le Village et le Marché | `infrastructure/achievements-projection.ts` | `achievements-projection.test.ts` (événements des trois modules), `achievements-api.test.ts` | ADR 0011, `docs/architecture.md` (diagramme de séquence) |
| B8 | Fonction d'aptitude qui protège une propriété du module : chaque haut fait, série et thème a son apparence dans le thème graphique ; les seuils des séries suivent les constantes du Village et du Donjon | `theme.test.ts`, `infrastructure/achievements-projection.test.ts` (tests « fixe le seuil… ») | `theme.test.ts` (4 tests), `achievements-projection.test.ts` (2 tests), `domain/achievements.test.ts` (« fait mesurer à tous les paliers d'une série le même compteur ») | `docs/architecture.md` (fonctions d'aptitude), bilan technique |
| B9 | Interface graphique avec effet marquant : refonte de toute l'interface en « royaume à parcourir » - carte du royaume animée comme écran d'accueil, scènes illustrées en SVG (village, donjon, taverne en vue isométrique, arène du classement, marché), mur de trophées en sceaux de cire avec bulle d'information, pastille « Nouveau ! » avec pulsation dorée, prochain objectif, icônes et décor de connexion dessinés | `src/modules/achievements/ui.tsx`, `domain/achievements.ts` (`newlyUnlocked`, `nextGoal`, `groupBySeries`), `src/ui/` (`kingdom-map.tsx`, `icons.tsx`, `login-backdrop.tsx`, `app-shell.tsx`), `scene-art.tsx` du Donjon et de la Taverne, `app/globals.css` | `domain/achievements.test.ts` : `newlyUnlocked`, `nextGoal`, `groupBySeries`, `groupByCategory` (la logique de l'effet est testée ; l'affichage est vérifié à la main, DT-014) | README, `docs/architecture.md`, fiche de cadrage (règles 7 à 9) |

## Écarts avec la fiche de cadrage

Aucun : les dix règles métier, la route `GET /api/achievements`, le stockage, la communication et les données personnelles sont réalisés comme annoncé. La fiche a été mise à jour le 2026-10-25 quand le périmètre s'est étendu (thèmes, séries de paliers, bâtiments, compagnons, Marché) ; elle correspond au rendu.

Modifications de l'existant (partie 4.2) :

- pour le module : `src/bootstrap/create-api.ts` (8 lignes : import, instanciation, données personnelles, règle du canal, protection des routes, montage), `src/ui/app-shell.tsx` (une entrée de navigation), `src/ui/theme.ts` (l'apparence de chaque haut fait), `app/globals.css` (styles des cartes) ;
- hors module, refonte de l'interface (branche `refonte-design`, une quinzaine de commits) : thème « grimoire et fer forgé » (`app/globals.css`, `app/layout.tsx`), carte du royaume en page d'accueil (`app/page.tsx`, `src/ui/kingdom-map.tsx`), scènes du Village, du Donjon, de la Taverne, du Marché et du Classement (`ui.tsx` de chaque module et leurs `scene-art.tsx`), icônes (`src/ui/icons.tsx`, `src/ui/entity.tsx`), écran de connexion (`app/login/page.tsx`, `src/ui/login-backdrop.tsx`). Aucune route, aucune API ni règle métier n'a changé. Deux changements de comportement : un nouveau compte est envoyé fonder son village, et les pages du jeu renvoient vers `/village` tant qu'il n'est pas fondé (`src/bootstrap/require-village.ts`, `hasVillage` dans `src/bootstrap/server.ts`, DT-017).

Aucun test existant n'a été supprimé, désactivé ou affaibli ; `.dependency-cruiser.cjs` et `architecture.test.ts` sont inchangés depuis `td11-fin`.

## Indicateurs au rendu

| Indicateur | À l'étiquette `td11-fin` | Au rendu |
| --- | --- | --- |
| Nombre de tests | 232 | 279 |
| Couverture des lignes | 75,00 % | 73,88 % |
| Violations des règles d'architecture | 0 | 0 |

La couverture baisse légèrement : l'écran des Hauts faits (`ui.tsx`) n'est pas testé automatiquement (dette DT-014).

## Usage de l'IA générative

- **Code et tests du module** : Claude Code a proposé le code avec une explication de chaque fichier. Pour la première partie du module (domaine, application, infrastructure, API, écran, données personnelles), j'ai créé les fichiers moi-même, lancé `pnpm lint:fix` et `pnpm verify`, et committé. Pour les évolutions (thèmes, séries, niveaux des bâtiments, compagnons, Marché, effet d'interface, tests de cohérence), Claude Code a appliqué les modifications dans le dépôt et m'a montré la comparaison ; j'ai relu les différences, lancé les vérifications et réalisé tous les commits. J'ai choisi l'idée du module, la liste des hauts faits et leur regroupement par séries, et validé la conception. Pour la refonte de l'interface, Claude Code a proposé plusieurs directions graphiques sous forme de maquettes ; j'en ai écarté quatre et choisi la cinquième, puis j'ai relu, testé à la main et rejeté ou fait corriger plusieurs propositions (menu radial du Donjon, icônes, podium, taille du Marché) avant de committer chaque étape. Les résultats ont été vérifiés par les tests, `pnpm verify`, des essais manuels sur le site local, puis sur le déploiement.
- **Documents** : Claude Code a rédigé les ADR 0010 et 0011 et leurs mises à jour, les ajouts à `architecture.md` et au README, la revue de sécurité, le registre de la dette, le registre des traitements, le bilan technique et ce document. Les chiffres ont été mesurés par Claude Code en exécutant les commandes du projet. J'ai relu chaque document et comparé son contenu au code.
- **ADR des TD précédents** : le contenu des ADR 0002 à 0009 a été rédigé avec Claude Code pendant l'évaluation, à partir des consignes de chaque TD et du code, puis relu par moi.
