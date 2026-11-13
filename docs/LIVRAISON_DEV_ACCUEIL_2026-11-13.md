# Livraison sur Dev — 13 novembre 2026

## Autorisation et destination
L’utilisateur demande explicitement de pousser la version locale sur https://github.com/Nyaru01/SkyJo/tree/Dev .

Branche de livraison : Dev. Base vérifiée avant l’opération : 23ac77b95d21be7ec150a33d2c353205c47b0ded, identique sur Dev et master. La branche master ne fait pas partie de cette livraison. Version applicative conservée : 3.3.26.

## Contenu
- Accueil sculptural : décor original de pavillon, palette pastel et présentation sobre.
- Modes réel et virtuel, raccourcis fonctionnels et navigation d’accueil.
- Illustration, captures des deux modes et compte rendu avec prompt du décor.
- Connexions de Dashboard au lancement rapide et aux écrans IA/défis existants.

Les essais rejetés, les archives graphiques et AGENT_HANDOFF.md restent locaux et ne sont pas inclus.

## Validation avant livraison
45 tests Node réussis ; lint ciblé réussi ; build Vite/PWA réussi. Contrôles UI aux formats 320×740 et 412×820, lancement rapide et accès aux défis vérifiés. Les détails et limites des contrôles sont dans INTERVENTION_ACCUEIL_PAVILLON_2026-11-13.md.

Le backend n’a pas été démarré. Le rendu sur appareil réel et un éventuel déploiement de Dev ne sont pas vérifiés. Le frontend local reste disponible sur http://127.0.0.1:5173/ .
