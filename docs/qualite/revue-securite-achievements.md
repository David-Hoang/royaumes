# Revue de sécurité des Hauts faits : accès, intégrité des compteurs et données personnelles

- Date : 2026-10-25
- Périmètre : API du module Hauts faits, projection des compteurs, canal temps réel, export et effacement des données personnelles.
- Références : OWASP Top 10 (A01 Broken Access Control, A04 Insecure Design, A08 Software and Data Integrity Failures).

| N° | Exigence | Vérification | Constat | Statut |
| --- | --- | --- | --- | --- |
| H1 | Toute adresse du module est réservée aux joueurs connectés, quelle que soit la méthode | Test « refuse une requête anonyme (401) » ; requêtes anonymes GET, POST et DELETE sur `/api/achievements`, avec `/` et `/alice` | Test réussi. Toutes les requêtes anonymes répondent 401 | Conforme |
| H2 | Un joueur ne consulte que ses propres hauts faits | Lecture de `api.ts` : aucune route n'accepte d'identifiant de joueur ; test « ne présente à un joueur que ses propres hauts faits » | Une seule route, qui utilise l'identifiant de la session. Bob ne voit aucune activité d'Alice | Conforme |
| H3 | Le module n'accepte aucune commande ni aucune entrée du joueur | Lecture de `api.ts` ; requêtes d'un joueur connecté en POST, DELETE et sur `/api/achievements/alice` | Une seule route GET, sans paramètre, sans corps ni requête : rien à valider. Les autres requêtes répondent 404 | Conforme |
| H4 | Aucun joueur ne peut modifier ses compteurs | `git grep -n -E "\.(insert\|update\|delete)\(" -- src/modules/achievements` | Les écritures n'existent que dans la projection, nourrie par le journal, et dans `personal-data.ts` pour l'effacement. Aucune route n'écrit | Conforme |
| H5 | Un événement n'est compté qu'une fois, même si la lecture est répétée | Test « n'applique pas deux fois un même événement quand la lecture est répétée » | Test réussi. Le point de reprise avance dans la même transaction que les compteurs (ADR 0006) | Conforme |
| H6 | Le résultat d'une expédition n'est attribué qu'à ses joueurs, compagnons exclus | Tests « attribue le résultat d'une expédition gagnée à ses joueurs, sans les compagnons » et « n'attribue rien à un joueur inconnu et ne mélange pas les joueurs » | Tests réussis | Conforme |
| H7 | Le canal du module ne transmet aucune donnée d'événement, en particulier la graine d'une expédition | Test « annonce sur son canal les événements lus, sans leurs données » | Test réussi : la graine de l'expédition n'est pas transmise | Conforme |
| H8 | Le canal annonce l'activité de tous les joueurs | Lecture de `index.ts` : canal global et discret ; route de repli `/api/stream/achievements/events?after=0` | Un joueur connecté peut savoir qu'une expédition a été créée ou qu'un bâtiment a été amélioré, sans savoir par qui. Le Classement révèle déjà des informations plus précises | Risque accepté |
| H9 | L'export ne contient que les compteurs du joueur demandé | Tests « exporte les compteurs du joueur, et seulement les siens » et « n'exporte rien pour un joueur qui n'a jamais joué » | Tests réussis | Conforme |
| H10 | L'effacement du compte supprime les compteurs, même si la projection a du retard, sans toucher aux autres joueurs | Tests « efface les compteurs du joueur sans toucher à ceux des autres » et « peut être relancé » | Tests réussis. Ce test a révélé un défaut pendant le développement : sans rattrapage préalable de la projection, les lignes étaient recréées après leur suppression. Corrigé avant le déploiement | Conforme |
| H11 | Le module ne conserve aucune donnée directement identifiante | Lecture de `infrastructure/schema.ts` | Les tables ne contiennent que l'identifiant du joueur et des compteurs entiers : aucun nom, aucun texte libre. L'identifiant reste pseudonymisé dans le journal (ADR 0008) | Conforme |
| H12 | Le module ne lit que le langage publié du Donjon et du Village | `pnpm lint:archi` ; `git grep -n "from '@/modules/" -- src/modules/achievements` | Aucune violation. Seuls les `contracts.ts` du Donjon et du Village sont importés, pour les préfixes de leurs flux | Conforme |
| H13 | Un joueur ne peut pas surcharger la base en répétant les lectures | Lecture de `drizzle-stats-reader.ts` : chaque lecture rattrape la projection | Le rattrapage ne traite que les événements nouveaux, mais le module n'a pas de limitation de débit propre. Même situation que le Classement (ADR 0006) | Risque accepté |

## Synthèse

Sur 13 exigences : 11 conformes, 0 non conforme, 2 en risque accepté (H8 et H13).

Actions décidées :

- aucune correction nécessaire ; le seul défaut trouvé, l'effacement avant rattrapage de la projection, a été corrigé avant le déploiement et protégé par un test (H10) ;
- la limitation du débit des lectures (H13) sera étudiée si le nombre de joueurs augmente ;
- le canal global (H8) devra être réexaminé si un événement publié transporte des informations plus sensibles.
