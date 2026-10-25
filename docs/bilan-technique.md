# Bilan technique de Royaumes

- Date : 2026-10-25
- Version examinée : étiquette `eval-fin` (le projet à `td11-fin`, plus le module Hauts faits)
- Auteur : David

Ce bilan dresse l'état technique du projet au terme de son développement, à partir de ses
décisions d'architecture, de ses indicateurs de qualité, de sa dette technique et de ses
revues. Il s'adresse à la personne qui reprendrait le projet.

## 1. Le système livré

| Élément | Valeur |
| --- | --- |
| Modules métier | 7 : `system`, `realm`, `dungeon`, `market`, `ranking`, `tavern`, `achievements` (6 à `td11-fin`) |
| Briques de la plateforme | 9 : `auth`, `cron`, `db`, `event-store`, `http`, `outbox`, `privacy`, `projection`, `realtime` |
| Lignes de code, hors tests | 8 503 dans `src/` (7 906 à `td11-fin`) |
| Fichiers de test, nombre de tests | 38 fichiers, 253 tests (33 fichiers, 232 tests à `td11-fin`) |
| Commits | 97 (76 à `td11-fin`) |
| Hébergement | Vercel (Francfort), base Neon (Francfort) |

| Module | Stockage | Lignes, hors tests |
| --- | --- | --- |
| `realm` | Event Sourcing | 1 129 |
| `dungeon` | Event Sourcing, projection des expéditions ouvertes | 2 095 |
| `market` | Event Sourcing, projection des offres, saga | 1 271 |
| `ranking` | Projection du journal | 459 |
| `tavern` | Tables ordinaires | 678 |
| `achievements` | Tables ordinaires tenues par une projection du journal | 520 |
| `system` | Aucun | 73 |

## 2. Les décisions d'architecture

| ADR | Décision | Mise à l'épreuve | Bilan |
| --- | --- | --- | --- |
| 0001 | Monolithe modulaire | Extraction du Village (TD11) | Les frontières ont tenu : le Village a pu s'exécuter dans un service séparé sans modifier les autres modules. Coût : deux chemins d'exécution à maintenir |
| 0002 | Event Sourcing pour le Village | Quatre projections construites à partir du journal sans modifier les modules qui écrivent | Tient. Réserve : lire un village rejoue tout son historique, sans instantanés |
| 0003 | Server-Sent Events alimentés par le journal | Canaux du Village, du Donjon, du Classement, du Marché, de la Taverne et des Hauts faits | Tient à l'échelle du projet. Limite connue : chaque flux relit le journal deux fois par seconde |
| 0004 | Manches simultanées et échéances paresseuses | Tests des échéances et des manches du Donjon | Tient. Limite : la fin d'une expédition abandonnée n'est jamais enregistrée |
| 0005 | Intelligence artificielle déterministe | Simulation d'équilibre (`scripts/simulate-dungeon.ts`) et tests statistiques | Tient. L'équilibre dépend de la règle suivie par les joueurs simulés ; les expéditions à quatre joueurs restent faciles |
| 0006 | CQRS et projections rattrapées à la lecture | Quatre projections, dont une dont la version a été augmentée (le meilleur butin du Classement) ; test de charge | Tient. La reconstruction a lieu pendant une consultation, dont la durée est limitée |
| 0007 | Saga orchestrée et boîte d'envoi | Échanges du Marché ; reprise de la saga après une panne du service Village | Tient. Les messages abandonnés sont examinables avec `scripts/dead-letters.ts` |
| 0008 | Taverne sans Event Sourcing, réécriture ciblée du journal | Export et effacement de tous les modules ; ajout du module Hauts faits | Tient. Le contributeur des Hauts faits s'est ajouté sans modifier la plateforme, et un défaut (effacement avant rattrapage de la projection) a été trouvé et corrigé. Coût de l'effacement : croît avec le journal |
| 0009 | Extraction du Village, préparée mais non déployée | Six tests de contrat | Frontières démontrées. Le service n'est pas déployable en l'état (DT-008 à DT-010) |
| 0010 | Tables de lecture tenues par une projection pour les Hauts faits | Création du module, migration, déploiement en production | Tient. La date d'obtention d'un haut fait n'est pas conservée |
| 0011 | Lecture du langage publié du Donjon et du Village par les Hauts faits | Lecture de quatre types d'événements sans modifier les modules qui les écrivent | Tient. Le couplage à la forme des événements n'est protégé que par des tests écrits à la main (DT-012) |

## 3. La qualité

| Caractéristique | Indicateur | Valeur | Appréciation |
| --- | --- | --- | --- |
| Adéquation fonctionnelle | Tests réussis ; couverture globale des lignes | 253 tests sur 253 (232 à `td11-fin`) ; 73,98 % des lignes (75,00 % à `td11-fin`) | Couverture en légère baisse : l'écran des Hauts faits n'est pas testé automatiquement (DT-014) |
| Efficacité des performances | Débit et p99 des lectures ; respect du budget | De 576 à 1 050 requêtes par seconde, p99 de 33 à 57 ms, aucune erreur, pour un budget de 500 ms (mesures de `td11-fin`) | Budget largement respecté. Le module Hauts faits n'a pas fait l'objet d'un test de charge |
| Fiabilité | Tests de concurrence, de reprise et d'idempotence ; messages abandonnés | Acceptations simultanées au Marché, reprise après la panne du service Village, messages en double, lectures répétées des projections | Les cas de panne et de doublon sont couverts. Les messages abandonnés se détectent avec `scripts/dead-letters.ts` |
| Sécurité | Exigences des revues de sécurité | Hauts faits : 13 exigences, 11 conformes, 2 risques acceptés. Autres revues : voir la section 5 | Revue du module à jour ; les revues précédentes ne sont pas terminées |
| Maintenabilité | Règles d'architecture ; fonctions d'aptitude ; couverture | 0 violation sur 157 modules et 502 dépendances ; 2 fonctions d'aptitude ; 73,98 % des lignes | Les règles d'architecture sont respectées par le module ajouté, sans modification de leur configuration |
| Flexibilité | Extraction d'un module ; changement de base entre local et production | Village extrait en service autonome (ADR 0009) ; PGlite en local et en test, Neon en production, avec les mêmes migrations | Le nouveau module s'ajoute en créant un répertoire et en le branchant dans `create-api.ts` |

## 4. La dette technique

| Indicateur | Valeur |
| --- | --- |
| Entrées consignées | 14 (10 à `td11-fin`) |
| Entrées remboursées, dont à l'échéance prévue | 7, toutes à l'échéance prévue (TD3, TD4, TD7, TD8, TD11) |
| Entrées ouvertes | 7 : DT-008 à DT-010 (service Village), DT-011 à DT-014 (Hauts faits) |

Analyse : la dette remboursée l'a toujours été à l'échéance annoncée. Les trois entrées du
service Village sont sans conséquence en production, puisque le service n'est pas déployé : elles
doivent être remboursées avant tout déploiement. Les quatre entrées des Hauts faits sont des
limites de charge ou de test sans effet sur le fonctionnement actuel. La plus risquée est DT-012 :
des tests de projection écrits à la main ne détecteraient pas une modification des événements du
Donjon ou du Village.

## 5. Les revues

| Revue | Exigences | Conformes | Non conformes ou en risque accepté | Actions ouvertes |
| --- | --- | --- | --- | --- |
| Sécurité de l'authentification | 16 | 2 constats rédigés, les 2 conformes | Non évalué | Rédiger les 14 constats manquants |
| Sécurité du Donjon | 14 | Constats non rédigés | Non évalué | Rédiger les constats |
| Sécurité du Marché | 10 | Constats non rédigés | Non évalué | Rédiger les constats |
| Conformité au RGPD | 10 | Constats non rédigés | Non évalué | Rédiger les constats |
| Sécurité des Hauts faits | 13 | 11 | 2 (H8 et H13) | Limitation du débit des lectures à étudier (DT-011) |

Les quatre revues précédentes ont été préparées avec leurs exigences et leurs vérifications, mais
leurs constats n'ont pas été rédigés : leur résultat n'est pas connu.

## 6. Risques et recommandations

| N° | Risque | Signe avant-coureur | Recommandation |
| --- | --- | --- | --- |
| 1 | La charge de la base croît avec le nombre de joueurs connectés, chaque flux relisant le journal deux fois par seconde | Le p99 des lectures approche 500 ms, ou les quotas de l'offre gratuite de Neon sont atteints | Espacer la relecture, ou la remplacer par une notification partagée entre instances |
| 2 | La reconstruction d'une projection a lieu pendant une consultation, dont la durée est limitée sur Vercel | Une reconstruction approche la durée maximale d'une fonction | Reconstruire par lots, ou dans une tâche dédiée |
| 3 | Le Classement et les Hauts faits dépendent de la forme des événements du Donjon et du Village : un événement modifié fausserait leurs compteurs sans erreur | Modification d'un événement publié | Des tests de contrat sur la forme des événements publiés (DT-012) |
| 4 | Les revues de sécurité et de conformité précédentes n'ont pas de constats | Une faille ou un manquement non détecté | Rédiger les constats de chaque revue avant toute mise en service ouverte au public |

## 7. Conclusion

Le projet tient ses décisions d'architecture : chaque module a pu être ajouté, y compris les
Hauts faits à la fin, sans modifier les modules existants ni les règles d'architecture, et le
Village a pu être extrait. Les points faibles sont la charge croissante de la relecture du journal,
la dépendance des lectures aux événements publiés, et des revues restées incomplètes. Le projet est
adapté à son public actuel, mais ne l'est pas encore pour un trafic plus grand.

## Usage de l'IA générative

Claude Code a mesuré les indicateurs en exécutant les commandes du projet (`pnpm test:coverage`,
comptage de lignes, `git rev-list`) et a rédigé ce bilan d'après le dépôt. J'ai choisi les
décisions et réalisé les TD ; j'ai relu ce document et vérifié les chiffres.
