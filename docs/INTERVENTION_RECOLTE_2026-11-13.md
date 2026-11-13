# Récolte : nouvelle présentation et retrait du bandeau en jeu

13 novembre 2026 — modifications locales demandées sur les deux captures fournies. Aucun commit, push ou changement de version.

## Réalisation

- `HarvestChallengeGuide.jsx` et `HarvestChallengeGuide.css` : nouvelle composition plein écran, titre aligné à gauche, illustration de deux colonnes de cartes, récompense +15 XP et deux objectifs dans une liste plus aérée. La grande feuille et les blocs de l’ancienne présentation sont remplacés. Les colonnes 5/5/5 et 8/8/8 sont des exemples graphiques explicitement légendés ; ces valeurs ne deviennent pas des conditions de réussite.
- Le bouton de lancement reste fixe en bas, avec contenu central défilant sur les petits écrans. Conteneur opaque et sans animation, focus et fermeture Échap conservés.
- `SeasonalChallengeButton.jsx` : guide dédié utilisé pour Récolte ; guide Équinoxe existant conservé. Disponibilité, délai, lancement réel et aperçu administrateur conservent leurs gestionnaires et paramètres.
- `VirtualGame.jsx` : suppression du bandeau de progression saisonnière pendant la partie.
- L’ancien composant visuel SeasonalProgress devient **SeasonalResult**, utilisé uniquement dans les résultats : message de réussite/échec et XP, sans nom de saison ni feuilles. Les compteurs métier de colonnes supprimées, la validation de réussite et les récompenses restent inchangés.

Skill UI UX Pro Max appliqué pour la composition mobile, la hiérarchie et les contrôles tactiles. Graphismes réalisés en HTML/CSS : aucune nouvelle image, dépendance ou modification des animations de cartes.

## Vérifications

- **45 tests réussis**, aucun échec ; moteur et validation saisonnière inclus dans la suite existante.
- ESLint ciblé sans erreur sur les deux composants de guide ; `git diff --check` sans erreur.
- Build Vite/PWA réussi, avec avertissements historiques de Browserslist, textures non résolues, imports mixtes et taille du bundle.
- Contrôle du vrai Dashboard dans un harnais temporaire sans le préchargement multimédia. Harnais supprimé après contrôle.
- Présentation inspectée à **390 × 844**. À **320 × 740** : document de 320 px sans débordement horizontal ; bouton de lancement entre y=666 et y=722, entièrement accessible ; contenu central défilant.
- Lancement réel du défi depuis le nouveau guide avec le profil local TestMobile, puis fermeture de l’annonce Tourment. Sur le plateau : deux mains présentes, aucun `.seasonal-progress`, aucun nom « Récolte d’automne » et aucune icône feuille dans le DOM rendu.
- Aucune manche terminée et aucune récompense attribuée lors de ce contrôle. Le résultat de fin de défi n’a pas été joué jusqu’au bout pendant cette intervention.

Captures : `screenshots/recolte-cartes-2026-11-13.jpg` et `screenshots/recolte-jeu-sans-bandeau-2026-11-13.jpg`.

## Essai utilisateur

Frontend local disponible sur **http://127.0.0.1:5173/** → Jouer → Récolte d’automne. Backend toujours arrêté. Vérification complète du chargement multimédia et essai tactile sur appareil réel à effectuer dans le navigateur habituel. Publication uniquement après validation et demande d’envoi.
