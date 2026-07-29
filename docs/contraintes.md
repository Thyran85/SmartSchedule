# Contraintes — SmartSchedule

## Contraintes intégrées (hardcodées dans l'algorithme)

Ces règles s'appliquent toujours, sans configuration :

| Règle | Description |
|---|---|
| **Début à 7h** | Tous les cours commencent à 7h (premier créneau). |
| **Max 5h consécutives** | Une même matière ne peut pas dépasser 5 créneaux d'affilée. |
| **Min 9h/jour** | Minimum 9h de cours par jour (par défaut, sauf si une contrainte `HEURES_MIN_JOUR` est ajoutée). Les jours avec 0h sont ignorés. |
| **Cours communs** | Si une classe générale a une `classe_technique` associée et que la matière est marquée `est_commun`, les deux classes sont programmées ensemble (même créneau, même salle, même enseignant). Contrainte forte. |

## Contraintes configurables (via l'interface)

Ajoutables/supprimables depuis le frontend, stockées en base de données :

| Code | Description | Champs |
|---|---|---|
| `INDISP_NIVEAU` | Indisponibilité d'un niveau (ex: Secondes pas cours mercredi après-midi) | niveau, jour, heure_limite |
| `INDISP_SALLE` | Indisponibilité d'une salle (ex: Laboratoire en maintenance) | salle, jour, heure_limite |
| `FIN_AVANCEE` | Fin des cours avancée (ex: vendredi 17h) | jour, heure_limite |
| `HEURES_MIN_JOUR` | Heures minimum par jour (écrase le défaut 9h) | valeur (en heures) |
| `MAX_HEURES_CONSEC` | Max heures consécutives par matière | matière, valeur (en heures) |
| `MAT_PERIODE` | Matière uniquement le matin (0) ou l'après-midi (1) | matière, valeur (0/1) |

## Fonctionnement général

1. L'algorithme découpe la semaine en **créneaux de 1h** (9/jour, 5 jours).
2. Pour chaque matière d'une classe, il tente de placer les heures requises dans des créneaux libres.
3. Les contraintes sont vérifiées dans cet ordre :
   - Disponibilité de la classe
   - Disponibilité du professeur
   - Préférences du professeur (évite après 16h)
   - Contraintes de niveau/globales (`INDISP_NIVEAU`, `FIN_AVANCEE`, etc.)
   - Disponibilité de la salle
   - Limite 5h consécutives
   - Limite 2h/jour de la même matière
4. Un score de qualité (0-100) est calculé après génération.

## Emploi du temps d'un lycée malgache

- Lundi à Vendredi
- Créneaux : 07h00-18h00
- Classes générales + techniques (Seconde, Première, Terminale)
- Salles spécialisées partagées : laboratoire, atelier, informatique
