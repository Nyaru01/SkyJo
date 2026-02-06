En mode développement , tout fonctionnait parfaitement. Aucun bug. Mais une fois déployé en préproduction, puis en production, nous avons commencé à recevoir des signalements de scintillements de l'interface utilisateur. Les menus déroulants se rechargeaient. Les onglets se réinitialisaient brièvement. Des écrans de chargement apparaissaient et disparaissaient de manière intempestive.

Et le pire ?
Ce n'était pas toujours reproductible.

Cela se produisait uniquement lors de la navigation rapide entre les onglets ou lors du changement de vue. Parfois, cela n'arrivait que sur des appareils moins performants ou des réseaux instables.

Après avoir ralenti l'enregistrement d'écran à 0,25x, je l'ai finalement remarqué au bout d'un certain temps :

Même avec des données mises en cache, le composant affichait brièvement une structure de base avant de passer au contenu réel.

Soupçonner les mauvaises choses
Je suis passée en mode détective.

Première hypothèse ? Les clés des composants. J’ai déjà constaté des comportements étranges lors de la manipulation de tableaux avec des clés instables.

Je me suis alors dit : peut-être que le double rendu en mode strict masquait quelque chose en développement.
Je l’ai supprimé, mais rien n’a changé.

J'ai même envisagé qu'une animation de chargement ou une transition CSS puisse s'afficher trop tard, ce qui donnait l'impression d'un scintillement.

Finalement, j'ai ouvert React DevTools Profiler et j'ai remarqué ce qui se passait…

Trouver le véritable coupable
Le problème ne venait pas du tout de la couche d'interface utilisateur .

Le problème résidait dans la manière dont nous gérions le chargement des données à l'aide de React Query .

Voici ce qui se passait :

![alt text](image.png)

À chaque montage du composant — même si des données étaient disponibles — React Query basculait brièvement isLoadingen truemode de récupération en arrière-plan.

Et je faisais ceci :

{isLoading ? < Skeleton /> : < UserProfile /> }
Ainsi, même avec des données mises en cache , le composant clignotait pendant environ 200 ms à chaque remontage.

Boum ! Mystère résolu.

Résolution du problème (enfin !)
J'ai examiné l'application et, une fois le problème identifié, les solutions n'étaient pas difficiles, mais elles étaient subtiles et complexes .

1. Afficher les chargeurs uniquement lors du premier chargement
J'ai introduit une vérification du chargement initial comme ceci :

const isFirstLoad = isLoading && !data; 

{isFirstLoad ? < Skeleton /> : < UserProfile /> }
Cela évitait les scintillements lorsque des données étaient déjà présentes, même en cas de récupération en arrière-plan.

2. Utilisez staleTimeet cacheTimeutilisez judicieusement
Par défaut, React Query considère les données comme « obsolètes », ce qui entraîne des récupérations fréquentes.

J'ai donc configuré :

![alt text](image-1.png)

Cela a permis une expérience utilisateur plus fluide . Plus aucun temps de chargement inutile lors du passage rapide d'une vue à l'autre.

3. Corriger les clés défectueuses qui ont provoqué des remontages
C'était gênant. Dans l'un des composants que j'utilisais pour le rendu :

< ListItem  key = {Math.random()} />
Cela garantissait un remontage à chaque fois. Je l'ai modifié comme suit :

< ListItem  clé = {item.id} />
Bien mieux. Plus besoin de remonter complètement le DOM simplement en naviguant entre les onglets.

4. Évitez le décalage de mise en page avecmin-height
Le scintillement était d' autant plus désagréable que la mise en page sautait : la hauteur du contenu diminuait, puis augmentait.

J'ai ajouté ceci :

![alt text](image-2.png)

L'espace est resté cohérent, même si la structure du bâtiment s'est brièvement dévoilée. Cela a donné à l'ensemble une impression de stabilité et de professionnalisme.

Ce que j'ai appris de tout ça
Il ne s'agissait pas d'un bug au sens habituel du terme.
Aucun plantage, aucun appel API n'a échoué.
Mais la perception compte plus qu'on ne le croit.

Les utilisateurs finaux se fichent complètement de savoir si votre système est parfaitement géré, si l' expérience est bancale .

Un simple scintillement de 100 ms peut suffire à donner l'impression qu'une interface utilisateur est défectueuse ou inachevée, ce qui posera problème car les utilisateurs n'apprécieront pas qu'un site web présente un dysfonctionnement, ce qui réduira certainement le trafic internet vers l'application.

Maintenant, je regarde toujours :

Comportement de montage/démontage
Politiques de fraîcheur du cache
Comment les états de chargement sont gérés visuellement
Quand les chargeurs ne devraient pas apparaître
Car parfois, ces petits détails comptent plus que la plus grande refonte.

