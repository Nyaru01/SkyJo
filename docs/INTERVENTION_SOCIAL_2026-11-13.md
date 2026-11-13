# Refonte du panneau Social

13 novembre 2026 — réalisation locale à partir de la capture utilisateur, puis correction demandée pendant le travail : retirer grade, niveau et XP du profil et remplacer le grand bouton Google blanc.

## État final

- `SocialProfileCard.jsx` : carte d’identité dédiée avec avatar modifiable, pseudo modifiable, SkyID et copie. **Aucun Challenger, niveau, XP ou indicateur de progression dans cette carte**, conformément à la correction utilisateur.
- Sauvegarde présentée sur une ligne compacte : icône, état de liaison du compte et bouton **Lier Google**, sombre et bordé. Plus de grand bouton blanc. Accès à « Restaurer un compte existant » conservé. L’état lié affiche « Compte Google lié », sans prétendre qu’une synchronisation vient d’être vérifiée.
- `SocialMenu.jsx` : utilisation du composant dédié ; sélecteur Classement/Amis plus lisible, boutons avec état pressé et focus. Les gestionnaires de Google, restauration, copie, mise à jour du profil, invitations et amis sont conservés. L’annotation anglaise Go_Settings est remplacée par Réglages.
- `Leaderboard.jsx` : podium opaque avec portraits proportionnés aux rangs, médailles compactes et alignement des noms, grades et XP. Premier au centre, deuxième à gauche, troisième à droite ; ordre des données fourni par l’application conservé, sans nouvel algorithme de tri.
- Liste des joueurs suivants plus lisible, gestion des noms longs et repère « Vous » conservé. Grades et XP restent présents **dans le classement**, seul le profil personnel a été épuré. État vide explicite sans suggérer à tort que le classement global nécessite d’ajouter des amis.
- `SocialPanel.css` : styles limités à ces composants, fonds plus opaques, contrastes et zones tactiles améliorés, absence d’animations de conteneurs dans le nouveau podium. Effets des portraits de carrière conservés avec prise en compte de reduced-motion.

Skills appliqués : UI UX Pro Max pour la composition mobile et la hiérarchie ; Vercel React Best Practices pour la séparation des composants. Aucune nouvelle dépendance ni modification des grades, XP, données ou routes d’authentification.

## Vérifications

- **45 tests réussis**, aucun échec.
- Build Vite/PWA réussi ; avertissements historiques (Browserslist, textures noise/felt, imports mixtes, bundle).
- ESLint ciblé sans erreur pour SocialProfileCard et Leaderboard. SocialMenu conserve **7 erreurs et 1 avertissement historiques**, comparés à HEAD, sans nouveau diagnostic. Le lint global n’est pas présenté comme vert.
- `git diff --check` sans erreur.
- Inspection du vrai Dashboard via un harnais temporaire avec **cinq joueurs fictifs**, pour contrôler Challenger, Maître, Prestige, podium et noms longs. Les lectures de classement et d’amis du harnais étaient simulées ; aucun faux joueur ajouté à l’application ou au backend. Harnais supprimé et onglets fermés à la fin.
- À **390 × 844** : profil, podium, liste, onglet Amis et état vide contrôlés. Ouverture de l’édition du pseudo puis annulation par Échap, ouverture de la sélection d’avatar sans changement.
- À **320 × 740** : absence de débordement horizontal du profil et du classement ; noms longs tronqués dans leur zone ; portraits du podium mesurés à 62/76/62 px. Bouton Google mesuré à environ **114 × 48 px**.
- Après la correction utilisateur : absence des éléments de progression confirmée dans le profil ; fond sombre du bouton Google contrôlé.
- Connexion Google, restauration de compte et copie dans le presse-papiers non déclenchées. Aucune validation des services réseau, backend arrêté.

Captures : `screenshots/social-profil-2026-11-13.jpg` (état final) et `screenshots/social-podium-demo-2026-11-13.jpg` (classement fictif).

## Essai utilisateur

Frontend disponible sur **http://127.0.0.1:5173/** → Social. Le profil réel dépend du stockage du navigateur ; le classement réel dépend du backend, toujours arrêté. Le harnais contournait le préchargement multimédia de l’application complète pour le contrôle graphique. L’essai complet reste à faire dans le navigateur habituel.

Version 3.3.24 conservée, aucun commit, push ou déploiement. Attendre la validation utilisateur avant tout envoi.
