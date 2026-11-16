# Accueil — volumes pastel et architecture — 13 novembre 2026

## Demande
L’utilisateur choisit la référence 4 (Monument Valley) parmi les pistes proposées. Adaptation à SKYJO, avec les fonctions déjà implémentées et une présentation nouvelle. Aucune publication demandée.

## Direction et modifications
- Palette pierre ivoire, corail, lavande et encre violette ; typographie espacée, ombres douces, surfaces mates.
- Nouveau décor original : cartes intégrées dans un pavillon architectural. Illustration décorative, commandes et textes rendus séparément en React.
- Illustration générée avec l’outil imagegen intégré, puis copiée dans public/artwork/home-pavilion-v1.png (1536×1024, PNG, 1 908 993 octets). Aucune image du jeu Monument Valley reprise dans l’application.
- HomeWorldScene affiche le décor avec dimensions réservées, priorité de chargement et mouvement vertical léger. Fondu des bords en CSS ; mouvement coupé avec prefers-reduced-motion.
- HomeVirtualActions présente trois accès sous la scène : Partie rapide/Reprendre, Défis, Contre l’IA. Les gestionnaires et routes existants sont conservés.
- GameSetup conserve ses états, les modales, les deux modes, les joueurs et les actions secondaires ; seuls la composition et les intitulés de présentation évoluent.
- HomeLobby.css est remplacé par les styles de cette direction. Navigation claire uniquement sur l’accueil.
- L’ancien éventail SVG et les anciens styles sont rangés dans docs/design-archive/reference-lobby-source, hors du code actif.
- Aucun nouveau moteur 3D ou paquet ajouté. Le relief du décor est illustré ; la scène n’est pas un modèle 3D manipulable.

## Skills
UI/UX Pro Max pour la composition et les interactions ; imagegen pour le décor original. Outil imagegen intégré utilisé, sans CLI.

## Vérification
- ESLint ciblé sur GameSetup et les composants home : réussi.
- Build Vite/PWA réussi, avertissements historiques (Browserslist, textures absentes, imports mixtes et bundle principal volumineux).
- Contrôles UI en 412×820 et 320×740 : pas de débordement horizontal ; bouton principal au-dessus de la navigation, y compris avec deux joueurs réels au format testé.
- Partie rapide : vrai plateau ouvert sur Retournez 2 cartes.
- Défis : accès à la section existante et focus sur Les rendez-vous.
- Mode réel : ajout d’un deuxième joueur et champs visibles.
- Les règles, les limites de joueurs et les animations du plateau ne sont pas modifiées.
- Tests UI sur des namespaces de persistance QA séparés, avec le vrai Dashboard. Le préchargement audio complet de l’application est contourné par le point d’entrée temporaire, supprimé après les captures. Backend non démarré.
- Appareil réel Samsung, clavier mobile, chargement sur réseau cellulaire et services distants restent à vérifier. Le PNG de 1,91 Mo représente un coût de chargement supplémentaire.

## Livrables locaux
- public/artwork/home-pavilion-v1.png
- docs/screenshots/accueil-pavillon-virtuel-2026-11-13.jpg
- docs/screenshots/accueil-pavillon-reel-2026-11-13.jpg
- Frontend : http://127.0.0.1:5173/

Aucun commit, push ou changement de version.

## Prompt final du décor (outil intégré, génération originale)

Create an original premium mobile card-game environment illustration, stylized-concept 3D isometric architectural diorama. Landscape 3:2 canvas. An exquisite small floating architectural island with sculptural ivory limestone arches, coral pink terraces, delicate lavender impossible stairways and a few balanced geometric towers. Three upright oversized playing-card slabs are physically integrated into the architecture, one mint card showing a clean white 4, one pale blue card showing 0 and one warm yellow card showing 8. Cards have subtly rounded edges and real thickness. It must feel like an elegant art-directed puzzle-game world: restrained architecture, beautifully considered proportions, soft ambient occlusion, poetic negative space, distant hazy lavender silhouettes, tiny pale steps descending to a still reflective surface. Central island occupies middle 65% of composition, entire island visible with generous clear margins. Warm pale peach sky #eed6ca at top blending into pale lavender #d5cbdc below. Gentle directional sunset lighting, matte stone and ceramic surfaces, exquisite soft shadows. Sophisticated harmonious colors, sharp clean architecture, tangible miniature craftsmanship. No people, no animals, no UI, no buttons, no logo, no text other than those three card numbers. No neon, no glitter, no metallic casino styling, no busy fantasy detail. This artwork is a decorative hero scene for an actual React app; all controls and headings will be rendered separately.

Résultat final des tests Node : 45 tests, 45 réussites, 0 échec.

## Livraison demandée ensuite
L’utilisateur autorise ensuite la livraison sur la branche Dev uniquement. Voir LIVRAISON_DEV_ACCUEIL_2026-11-13.md. Les mentions de non-publication ci-dessus décrivent l’état de la validation locale avant cette demande.
