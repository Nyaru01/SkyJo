# SkyJo 3.3.25 — interface mobile

13 novembre 2026. Publication demandée par l’utilisateur après les essais locaux et les corrections graphiques.

## Changements

- Menu Jouer hiérarchisé et navigation à cinq destinations, avec espace Profil pour l’historique et les réglages.
- Écran de duel et défi quotidien repensés ; mascottes réutilisées dans une présentation plus visible, avec sélection de difficulté accessible.
- Guide Récolte illustré par des cartes ; bandeau saisonnier et feuilles retirés du plateau, résultat du défi conservé en fin de partie.
- Scores et tour actif plus lisibles ; dimensions et animations des cartes préservées.
- Plan de carrière centralisé, fenêtres opaques stables et gestion du focus clavier.
- Panneau Social et podium refondus. Grade, niveau et XP retirés du profil personnel ; bouton Google sombre et compact. Les informations de carrière restent dans le classement.

## Validation

- 45 tests réussis, aucun échec.
- Build Vite/PWA réussi ; avertissements connus de Browserslist, textures noise/felt, imports mixtes et taille du bundle.
- ESLint ciblé réussi sur les composants nouveaux ou sans dette préalable ; les diagnostics historiques de SocialMenu, VirtualGame et DrawDiscardTrigger sont documentés dans les comptes rendus, sans nouveau diagnostic introduit.
- Vérifications graphiques et interactions locales décrites dans les documents INTERVENTION du 13 novembre ; captures dans `docs/screenshots/`.

Les contrôles graphiques utilisaient le Dashboard réel sans l’introduction et le préchargement multimédia. Le classement de démonstration n’est pas intégré à l’application. Connexion Google, restauration, multijoueur, synchronisation et rendu de production ne sont pas présentés comme validés. Aucun backend n’a été démarré contre la base distante lors des essais.

Les comptes rendus précédents conservent leur état historique « local, aucun push » ; l’autorisation d’envoi est postérieure. Cette version regroupe leurs modifications. Le fichier local de reprise AGENT_HANDOFF.md n’est pas inclus dans cette publication.
