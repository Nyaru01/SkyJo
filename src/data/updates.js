export const UPDATES = [
    {
        id: 19,
        version: "2.5.2",
        date: "10 Fév. 2026",
        title: "Mode Tourment : Sync & Échanges",
        description: "Correction majeure des actions spéciales en ligne et amélioration du rendu visuel des cartes Bonus.",
        isNew: true,
        type: "minor",
        changes: [
            { text: "Action Échange (S) : Synchronisation parfaite en multijoueur", type: "feat" },
            { text: "Visuel : La carte Échange affiche son logo fléché partout", type: "improve" },
            { text: "Stabilité : Les cartes spéciales utilisées sont désormais correctement consommées", type: "fix" },
            { text: "Gameplay : Correction des blocages lors des erreurs d'échange ou de placement", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 18,
        version: "2.5.1",
        date: "09 Fév. 2026",
        title: "Notifications Ultra-Stables",
        description: "Migration vers Firebase (FCM) et optimisation de la réception en arrière-plan.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "FCM Engine : Nouvelle infrastructure de notifications plus rapide et fiable", type: "feat" },
            { text: "Deep-Links Fix : Correction des redirections vers les salles de jeu", type: "fix" },
            { text: "Stabilité SW : Le Service Worker est désormais plus résistant aux erreurs réseau", type: "improve" },
            { text: "Ergonomie : Suppression des actions instables pour une expérience simplifiée", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 17,
        version: "2.5.0",
        date: "08 Fév. 2026",
        title: "Le Panthéon & Excellence Visuelle",
        description: "Une refonte complète des statistiques et des effets 3D pour les champions.",
        isNew: true,
        type: "major",
        changes: [
            { text: "Le Panthéon : Une nouvelle interface de stats épurée et prestigieuse", type: "feat" },
            { text: "Effets 3D Premium : Le #1 mondial profite d'un socle doré et d'animations exclusives", type: "feat" },
            { text: "XP Clarifiée : Remplacement des étoiles par des mentions 'XP' pour une lecture instantanée", type: "improve" },
            { text: "Panthéon Ergonomique : Le palmarès détaillé est désormais pliable pour plus de clarté", type: "improve" },
            { text: "IA Boostée : Correction d'un bug bloquant sur la carte Crâne Maudit (20)", type: "fix" },
            { text: "Stabilité Mobile : Correction des clignotements et optimisation du LevelUp", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 16,
        version: "2.4.0",
        date: "04 Fév. 2026",
        title: "Notifications Push & Deep-Links",
        description: "Rejoignez une partie d'un simple tap sur la notification, même app fermée !",
        isNew: false,
        type: "major",
        changes: [
            { text: "Deep-Linking : Cliquer une notification ouvre directement la bonne salle", type: "feat" },
            { text: "Push PWA : Les invitations arrivent même quand l'app est fermée", type: "feat" },
            { text: "Design 'Alive' : Logos qui respirent et effets shimmer sur les boutons", type: "feat" },
            { text: "Badges Dynamiques : Alertes visuelles pour les nouveaux contenus", type: "improve" },
            { text: "Navigation : Transition fluide de l'intro vers le lobby", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 15,
        version: "2.3.0",
        date: "03 Fév. 2026",
        title: "Effet Neon Beam & Correctifs",
        description: "Une validation de colonne plus spectaculaire et des correctifs de stabilité.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Neon Beam : Un effet visuel 'Slash' spectaculaire lors de la validation d'une colonne", type: "feat" },
            { text: "Stabilité : Correction d'un bug critique dans la main du joueur (Syntax Error)", type: "fix" },
            { text: "Audio : Amélioration des sons d'ambiance", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 14,
        version: "2.2.0",
        date: "03 Fév. 2026",
        title: "Immersion 3D & Gyroscope",
        description: "Une expérience tactile inédite avec des boutons réactifs et des règles ajustées.",
        isNew: true,
        type: "major",
        changes: [
            { text: "Boutons Arcade : Un design 'Push' satisfaisant avec effet de profondeur", type: "feat" },
            { text: "Règle 'Crâne Maudit' (20) : Remplacement OBLIGATOIRE si pioché (Anti-triche IA)", type: "fix" },
            { text: "Correctifs Couleurs : Le 20 est bien Rouge et le -10 Violet partout", type: "fix" },
            { text: "Stabilité : Correction du crash au démarrage (Tailwind Config)", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 13,
        version: "2.1.0",
        date: "29 Janv. 2026",
        title: "Raffinement UI & Gameplay",
        description: "Optimisation de l'interface de jeu et du confort visuel.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Interface de jeu : Nouveau Header unifié 'Pill Design' avec animations Glassmorphism", type: "improve" },
            { text: "Notifications IA : Suppression des messages intrusifs pendant le tour de l'IA", type: "improve" },
            { text: "Confort Visuel : Ajustement de la position des badges joueurs et harmonisation des couleurs (#1A4869)", type: "improve" },
            { text: "Lobby : La musique ne joue plus pendant la phase de préparation", type: "fix" },
            { text: "Musique : Ajout d'un bouton 'Musique Aléatoire' 🎵", type: "feat" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 12,
        version: "2.0.9",
        date: "29 Janv. 2026",
        title: "Chat Privé & Notifications Premium",
        description: "Communiquez en temps réel avec vos amis sans quitter votre partie.",
        isNew: false,
        type: "major",
        changes: [
            { text: "Chat Privé : Interface style WhatsApp pour discuter en direct", type: "feat" },
            { text: "Chat In-Game : Lis et réponds aux messages sans quitter ta partie", type: "feat" },
            { text: "Notifications Premium : Nouveau bandeau élégant et discret", type: "improve" },
            { text: "Sync Multi-onglets : Synchronisation parfaite entre tes écrans", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 11,
        version: "2.0.0",
        date: "28 Janv. 2026",
        title: "Skyjo V2 : Le Grand Lancement",
        description: "L'expérience Skyjo ultime est là. Mode social, persistance Cloud et design ultra-premium.",
        isNew: false,
        type: "major",
        changes: [
            { text: "SkyID : Crée ton identité unique et retrouve tes amis", type: "feat" },
            { text: "Cloud Sync : Tes niveaux et scores sont désormais sauvegardés en ligne", type: "feat" },
            { text: "Hub Social : Liste d'amis, classement mondial et invitations en temps réel", type: "feat" },
            { text: "Feedback Hub : Une nouvelle interface pour nous aider à améliorer le jeu", type: "feat" },
            { text: "PWA v2 : Icônes modernisées et stabilité de l'application accrue", type: "improve" },
            { text: "Design Glassmorphism : Une interface plus fluide, sombre et élégante", type: "improve" },
            { text: "Règles du Jeu : Accès direct aux règles depuis le menu", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 10,
        version: "1.9.5",
        date: "27 Janv. 2026",
        title: "Optimisation Sociale",
        description: "Amélioration de la fiabilité des invitations et de la présence en ligne.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Invitations Atomiques via serveur", type: "feat" },
            { text: "Gestion multi-appareils stabilisée", type: "improve" },
            { text: "Auto-SkyID pour les nouveaux joueurs", type: "fix" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 9,
        version: "1.9.0",
        date: "26 Janv. 2026",
        title: "Stats & UI Premium",
        description: "Refonte du design et ajout du podium des leaders.",
        isNew: false,
        type: "minor",
        changes: [
            { text: "Podium interactif et graphiques d'évolution", type: "feat" },
            { text: "Historique unifié et Hero Header", type: "improve" }
        ],
        image: "/premium-bg.jpg"
    },
    {
        id: 7,
        version: "1.1.0",
        date: "15 Janv. 2025",
        title: "IA Améliorée",
        description: "L'IA prend désormais des décisions plus intelligentes basées sur les probabilités.",
        type: "improvement",
        changes: [
            { text: "Algorithme de l'IA optimisé", type: "improve" },
            { text: "Meilleure gestion de la défausse", type: "improve" },
            { text: "Corrections de bugs mineurs", type: "fix" }
        ]
    }
];
