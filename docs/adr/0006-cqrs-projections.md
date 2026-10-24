# ADR-0006 - CQRS : modèles de lecture tenus par des projections rattrapées à la lecture

- Statut : accepté
- Date : 2026-10-21

## Contexte

Certaines lectures traversent tous les flux : le classement et la liste des expéditions
ouvertes. Les calculer en rejouant le journal coûte de plus en plus cher avec l'historique
du jeu (dette DT-005).

L'hébergement ne permet aucun processus permanent (ADR 0004). Le journal donne à chaque
événement une position globale, croissante mais pas forcément continue (ADR 0002).

## Décision

Les lectures qui traversent les flux s'appuient sur des modèles de lecture, rangés dans le
schéma PostgreSQL de leur module. Les décisions, elles, s'appuient toujours sur le modèle
d'écriture.

Chaque modèle de lecture est tenu à jour par une projection, dont le point de reprise est
enregistré dans `platform.projections`. Une projection est rattrapée quand on la consulte,
dans une seule transaction, avec le point de reprise verrouillé. Le rattrapage s'arrête
devant une position manquante tant que l'événement suivant a moins de 5 s (`gapGraceMs`).

Chaque projection a une version : une version plus haute que celle des tables déclenche leur
reconstruction, une version plus basse interdit toute écriture. Le classement est annoncé aux
navigateurs par un canal global et discret ; l'interface relit le classement jusqu'à ce que
la projection ait atteint la position annoncée.

## Conséquences

### Positives

- Le coût d'une consultation ne dépend plus de l'historique.
- Les modules qui écrivent ne savent rien des projections qui les lisent.
- On peut calculer de nouvelles informations sur le passé sans migrer de données.
- Aucune tâche de fond, ni opération manuelle après un déploiement.

### Négatives

- Cohérence à terme : un modèle de lecture peut avoir quelques secondes de retard.
- La reconstruction se fait pendant une consultation, dont la durée est limitée sur Vercel :
  elle deviendra impossible au-delà d'une certaine taille du journal.
- Après un retour à une version précédente de l'application, une projection dont la version a
  été augmentée n'avance plus jusqu'au déploiement suivant.
- Le Classement dépend des événements des autres modules : un événement modifié sans
  réexamen de ses lecteurs passe inaperçu, comme pour la liste des expéditions ouvertes.

## Alternatives écartées

- **Mise à jour des modèles dans la commande, par le module qui écrit** : le module saurait
  qui le lit, et casserait les frontières.
- **Tâche planifiée** : une fois par jour sur l'offre gratuite, c'est trop lent.
- **Processus de fond abonné au journal** : impossible sans processus permanent.
- **Vue matérialisée PostgreSQL** : entièrement recalculée à chaque rafraîchissement, donc
  le coût croît avec l'historique.
- **Garder le calcul par rejeu** : le coût de chaque lecture croît avec le jeu.

## Réexamen

À revoir si une reconstruction approche la durée maximale d'une fonction, si le verrou du
point de reprise devient un goulet d'étranglement, ou si une lecture strictement à jour est
nécessaire.

## Usage de l'IA générative

Claude Code, pour la rédaction à partir des consignes du TD8 et du code. Relu par moi et
comparé au code.
