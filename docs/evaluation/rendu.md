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
| E3 | `domain/catalog.ts`, `domain/achievements.ts` | `domain/achievements.test.ts` (règles 1 à 5 de la fiche) |
| E4 | `infrastructure/schema.ts` (schéma `achievements`), `drizzle/0013_achievements.sql` | `src/bootstrap/architecture.test.ts` (chaque table dans un schéma propre), `infrastructure/achievements-projection.test.ts` |
| E5 | `api.ts`, `src/bootstrap/create-api.ts` (`requireUser` sur `/achievements` et `/achievements/*`) | `achievements-api.test.ts` : « refuse une requête anonyme (401) » et « ne présente à un joueur que ses propres hauts faits » (règle 6). La route n'accepte aucune entrée à valider |
| E6 | `infrastructure/achievements-projection.ts` (lit `GameCreated`, `PlayerJoined`, `GameEnded` du Donjon et `BuildingUpgraded` du Village) | `infrastructure/achievements-projection.test.ts`, `achievements-api.test.ts` |
| E7 | `personal-data.ts` (export et effacement ; le module n'a pas d'événements propres à réécrire) | `personal-data.test.ts`, `architecture.test.ts` (déclaration des données personnelles) |
| E8 | Toutes les règles de la fiche et la route `GET /api/achievements` | Règles 1 à 5 : `domain/achievements.test.ts` ; règle 6 : `application/achievements-service.test.ts` et `achievements-api.test.ts` ; route : `achievements-api.test.ts` (4 tests) |
| E9 | `.dependency-cruiser.cjs` et `architecture.test.ts` inchangés depuis `td11-fin` | `pnpm verify` : 0 violation |
| E10 | Migration `drizzle/0013_achievements.sql` appliquée par `vercel-build` | Parcours sur le déploiement : page `/achievements`, export et suppression d'un compte de test |

## Bonus revendiqués

| N° | Description | Fichiers | Tests | Documentation |
| --- | --- | --- | --- | --- |
| B1 | Canal temps réel propre au module (`achievements`), global et discret, avec sa règle d'accès | `index.ts` (`channelPolicy`), `contracts.ts`, `ui.tsx` | `achievements-api.test.ts` : « annonce sur son canal les événements lus, sans leurs données » | README (Temps réel), `docs/architecture.md`, ADR 0011 |
| B4 | Modèle de lecture tenu par une projection, avec son point de reprise et sa version | `infrastructure/achievements-projection.ts` (version 1), `infrastructure/drizzle-stats-reader.ts` | `infrastructure/achievements-projection.test.ts`, `personal-data.test.ts` (rattrapage avant l'effacement) | ADR 0010, `docs/architecture.md`, README |
| B6 | Communication avec deux modules existants, le Donjon et le Village | `infrastructure/achievements-projection.ts` | `achievements-projection.test.ts` (événements du Donjon et du Village), `achievements-api.test.ts` | ADR 0011, `docs/architecture.md` (diagramme de séquence) |

## Écarts avec la fiche de cadrage

Aucun : les six règles métier, la route `GET /api/achievements`, le stockage, la communication et les données personnelles sont réalisés comme annoncé.

Modifications de l'existant (partie 4.2) :

- pour le module : `src/bootstrap/create-api.ts` (8 lignes : import, instanciation, données personnelles, règle du canal, protection des routes, montage), `src/ui/app-shell.tsx` (une entrée de navigation), `src/ui/theme.ts` (une entrée de thème), `app/globals.css` (styles des cartes) ;
- hors module, avant l'évaluation : deux commits d'interface (thème pierre et or, cartes du Village, barres de vie du Donjon) ont modifié `app/globals.css`, `app/layout.tsx`, `src/ui/entity.tsx`, `src/modules/realm/ui.tsx` et `src/modules/dungeon/ui.tsx`. Ce sont des changements d'apparence, sans modification de la logique.

Aucun test existant n'a été supprimé, désactivé ou affaibli ; `.dependency-cruiser.cjs` et `architecture.test.ts` sont inchangés depuis `td11-fin`.

## Indicateurs au rendu

| Indicateur | À l'étiquette `td11-fin` | Au rendu |
| --- | --- | --- |
| Nombre de tests | 232 | 253 |
| Couverture des lignes | 75,00 % | 73,98 % |
| Violations des règles d'architecture | 0 | 0 |

La couverture baisse légèrement : l'écran des Hauts faits (`ui.tsx`) n'est pas testé automatiquement (dette DT-014).

## Usage de l'IA générative

- **Code et tests du module** : Claude Code a proposé le code, fichier par fichier, avec une explication de chacun. J'ai créé les fichiers moi-même, lancé `pnpm lint:fix` et `pnpm verify`, et committé. J'ai choisi l'idée du module et validé sa conception. Les résultats ont été vérifiés par les tests, `pnpm verify`, un essai manuel sur le site local, puis sur le déploiement.
- **Documents** : Claude Code a rédigé les ADR 0010 et 0011, les ajouts à `architecture.md` et au README, la revue de sécurité, le registre de la dette, le registre des traitements et le bilan technique. Les chiffres ont été mesurés par Claude Code en exécutant les commandes du projet. J'ai relu chaque document et comparé son contenu au code.
- **ADR des TD précédents** : le contenu des ADR 0002 à 0009 a été rédigé avec Claude Code pendant l'évaluation, à partir des consignes de chaque TD et du code, puis relu par moi.
