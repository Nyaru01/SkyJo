# SkyJo — proposition d’amélioration graphique mobile

Date : 13 novembre 2026. Statut : proposition à valider, aucune refonte appliquée.

Suite à l’accord « essayons », un prototype local du lot 1 a été réalisé. Voir [le compte rendu et ses limites de validation](INTERVENTION_MENU_MOBILE_2026-11-13.md). Les constats ci-dessous décrivent l’état initial et les lots suivants restent proposés.

Suite à la demande suivante, les lots navigation, plateau, carrière et finitions ont été réalisés localement : [compte rendu des lots suivants](INTERVENTION_INTERFACE_MOBILE_2026-11-13.md). L’ensemble attend la validation utilisateur avant tout envoi.

## Périmètre et constat

Lecture de `AGENT_HANDOFF.md`, de la configuration Vite et des composants du menu, de la navigation, des mains et des styles partagés. Il s’agit d’une analyse du code, sans inspection visuelle dans un navigateur : les problèmes de rendu restent à confirmer sur appareil.

- `GameMenu.jsx` présente plusieurs grandes cartes aux dégradés et effets concurrents. L’action de reprise, les modes et les défis gagneraient à être mieux hiérarchisés.
- `Navbar.jsx` affiche six destinations et des libellés de 9 à 10 px : une navigation plus courte permettrait des intitulés plus lisibles sur téléphone.
- `PremiumTiltButton.jsx` ajoute un reflet récurrent à chaque bouton actif ; le menu ajoute des flottements, pulsations et rotations. Réduire leur simultanéité pour recentrer l’attention.
- `index.css` fournit déjà des variables visuelles et des safe areas. Les étendre plutôt que superposer un nouveau thème indépendant.
- `Tabletop.css` possède déjà une direction sombre, des accents menthe et des effets de matière. La conserver comme socle du plateau.
- Les petits libellés de piles, les contrastes et la place disponible doivent être mesurés avant toute modification des dimensions du jeu.

## Skills utilisés

1. **UI UX Pro Max**, installé localement : recherche `mobile card game` dans le domaine `product`, avec correspondance **Card & Board Game**, et recherches UX sur le tactile et la réduction des animations. La référence jeu recommande une profondeur réservée aux cartes et une interface simple autour. La recherche de style `gaming` n’a donné aucun résultat ; la recherche complémentaire `flat design` a fourni les principes de simplicité retenus pour les commandes.
2. **Vercel React Best Practices**, installé localement : cadre de performance pour la future réalisation React, notamment chargement conditionnel des écrans lourds et maîtrise des rendus.

Aucun skill exclusivement dédié au jeu mobile n’est présent dans le catalogue disponible. UI UX Pro Max contient des références spécifiques aux jeux de cartes et des règles mobiles ; le skill Vercel est un complément technique, pas un skill de game design. Aucune installation supplémentaire effectuée.

## Direction proposée : une table de jeu premium et lisible

Conserver l’identité colorée des cartes, les skins, les avatars et Outfit. Utiliser un environnement bleu nuit, avec des panneaux plus opaques et des reliefs discrets. Les cartes restent les objets les plus expressifs ; les commandes se font plus calmes.

Palette de travail, à mesurer dans les compositions réelles : fond `#0B1420`, panneau `#152330`, texte principal `#F4F8FF`, texte secondaire `#B8C6D9`, action menthe `#7EE7CC` avec texte sombre, récompense or `#E4C68E`. Réserver le cuivre à Récolte et le cyan/violet à Prestige. Ne pas recolorer les valeurs des cartes.

Rythme de 4/8 px, marges mobiles de 16 px, rayons de panneaux cohérents autour de 20–24 px. Corps de texte courant autour de 16 px ; chiffres de score tabulaires. Conserver Lucide pour éviter de mélanger les familles d’icônes.

## Plan par lots

| Lot | Changements proposés | Critères de validation |
| --- | --- | --- |
| 1 — Menu Jouer, priorité haute | Une action dominante : « Reprendre » si une partie existe, sinon « Jouer contre l’IA ». Modes secondaires plus sobres ; défis regroupés avec récompense et disponibilité lisibles. Réduire la hauteur de l’en-tête fixe. | Action principale identifiable immédiatement ; modes et plan de carrière accessibles ; états disponible/terminé compréhensibles sans dépendre de la couleur. |
| 2 — Navigation mobile | Passer de six à cinq destinations : Accueil, Social, Jouer, Stats, Profil. Réunir Parties et Réglages dans le nouvel espace Profil, avec accès explicites. | Chaque fonction existante reste accessible ; libellés lisibles ; retour prévisible ; aucune liste masquée sous la barre basse. |
| 3 — Plateau et HUD | Harmoniser badges, scores et boutons avec le socle existant. Renforcer l’indication textuelle du tour et la distinction pioche/défausse. Agrandir les petits libellés si la place le permet. | Grille de 4 colonnes × 3 lignes inchangée ; aucun déplacement d’ancrage des animations ; tour, carte sélectionnée et action autorisée évidents. |
| 4 — Carrière, défis et fenêtres | Unifier en-têtes, espacements, fermeture et actions basses. Rendre XP, grade et prochaine récompense faciles à distinguer. Préserver les fenêtres opaques stables. | Aucun flash à l’ouverture ; focus et Échap corrects ; pas de double portail ; aucune récompense fictive ni modification du calcul de progression. |
| 5 — Finitions mobiles | Réduire reflets et mouvements permanents du menu ; retours d’appui courts, autour de 120–180 ms à ajuster. Alléger les flous après mesure. Vérifier états chargement, erreur, indisponibilité et réseau absent. | Respect de reduced-motion ; aucune secousse de mise en page ; cartes toujours fluides ; message explicite si une fonction réseau est inaccessible. |

Premier prototype recommandé : **lot 1 uniquement**, accompagné des variables partagées strictement nécessaires. Valider la direction avant de modifier la navigation ou le plateau.

## Garde-fous du jeu mobile

- Viser des commandes principales d’au moins 48 × 48 CSS px, espacées d’environ 8 px. Contrôler séparément les cartes selon la grille disponible ; ne pas agrandir leurs zones au point de provoquer des recouvrements.
- Tester à 320, 375, 390 et 430 px, puis en paysage et sur tablette. Tester un écran de faible hauteur, le zoom et les textes agrandis.
- Vérifier contrastes : au moins 4,5:1 pour les textes courants et 3:1 pour les éléments graphiques porteurs d’information.
- Tenir compte des safe areas déjà appliquées au body pour ne pas doubler les marges.
- Préserver l’introduction approuvée, les déplacements de cartes, le stockage colonne d’abord, les règles, les délais et récompenses des défis, les sauvegardes et les protections des aperçus administrateur.
- Les améliorations de carrière ne doivent pas faire croire que des catalogues Prestige supplémentaires existent déjà.

## Validation locale obligatoire avant publication

1. Réaliser un lot localement et documenter les fichiers modifiés dans `docs/`.
2. Exécuter les tests, le build, le lint ciblé et `git diff --check` pour les modifications de code.
3. Lancer le serveur local et fournir l’URL à l’utilisateur. Contrôler visuellement menu, reprise, partie IA, actions de carte, fin de manche, carrière et défis selon le lot ; faire valider le fonctionnement par l’utilisateur.
4. Si le lot touche les fonctions réseau, préparer un backend et une base isolés pour les vérifier. Un frontend seul ne valide ni le multijoueur ni la synchronisation.
5. Attendre le retour utilisateur et corriger les problèmes. Un serveur accessible ou un build vert ne vaut pas validation fonctionnelle.
6. Publier uniquement après validation du fonctionnement et instruction explicite d’envoi. Un push sur master déclenche Railway.

## Intervention de ce tour

- Création de ce document dans `docs/`, sans modification applicative ni suppression de fichiers.
- Conservation de `AGENT_HANDOFF.md`, déjà non suivi avant l’intervention.
- Démarrage du frontend Vite à `http://127.0.0.1:5173/`, limité au poste local, avec import en mémoire du fichier d’environnement parent sans affichage de ses valeurs.
- Backend non démarré : la reprise indique que son démarrage peut lancer des migrations sur PostgreSQL distant. Les fonctions API et Socket.io ne sont donc pas validables intégralement dans cet aperçu.
- Aucun commit, push, changement de version ou déploiement. Tests applicatifs non rejoués pour cette proposition documentaire.
