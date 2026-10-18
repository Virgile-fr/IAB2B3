# Avant de commencer

Tu reprends un travail de rédaction déjà engagé avec l’enseignant. Ce fichier transmet le contexte et l’état du travail pour pouvoir continuer dans une nouvelle conversation.

## Le module

Le module d’expérimentation IA s’adresse aux B2 et B3 en Bachelor Design Graphique à Condé Nice. Les étudiants utilisent déjà les outils d’IA, sans nécessairement connaître leur fonctionnement ni le développement web.

Ils réalisent un site de 1 à 3 pages en deux journées communes : préparer les contenus, produire les images, puis construire et corriger le site. Les B3 disposent aussi d’une séance préalable dans Figma pour préparer leur design system et leur zoning. Les B2 s’appuient sur un moodboard.

La théorie doit leur donner les repères nécessaires pour guider les outils et reprendre les résultats selon leurs propres choix graphiques et éditoriaux. Le premier bloc « Comprendre les outils » ne dure que 30 minutes : chaque notion doit rester proportionnée à ce temps.

## Les documents à lire

Avant de proposer du contenu, lis :

1. [instructions.md](instructions.md) : la manière de rédiger et de travailler avec l’enseignant.
2. [syllabus.md](syllabus.md) : les objectifs, les publics et les rendus.
3. [déroullé.md](déroullé.md) : la progression et le temps disponible.
4. Les trois références validées ci-dessous, dans leur intégralité.

## Ce que signifie « cours n° 4 » ici

Dans le dossier « modèles, interfaces et usages », chaque fichier numéroté correspond actuellement à **une slide**, avec assez de texte pour soutenir l’explication orale. « Faire le cours n° 4 » signifie préparer la quatrième slide, pas développer un chapitre complet en plusieurs slides.

Les références validées sont :

- [1 : Derrière le mot « IA »](modèles,%20interfaces%20et%20usages/1.md)
- [2 : Modèle ≠ interface](modèles,%20interfaces%20et%20usages/2.md)
- [3 : Les modèles de langage : LLM](modèles,%20interfaces%20et%20usages/3.md)

Observe leur longueur, leur vocabulaire et la manière dont les explications s’enchaînent. Le fichier 3 est la référence la plus récente : il a été ajusté avec l’enseignant, notamment pour présenter l’entraînement, le prompt et le contexte en liste, puis expliquer la prédiction avec l’exemple du téléphone.

## État du travail à la reprise

Le sujet pratique des B3 est validé et enregistré dans [B3.md](modèles,%20interfaces%20et%20usages/B3.md). Il part de leur moodboard, zoning et design system existants : présentation du projet au LLM, création de deux personas, discussion simulée pour questionner le zoning, rédaction des contenus et préparation des visuels. Les images reçoivent un nom de fichier reporté dans Figma afin d’indiquer ensuite au LLM leur emplacement et leur cadrage lors de la construction du site.

Le sujet pratique des B2 est validé et enregistré dans [B2.md](modèles,%20interfaces%20et%20usages/B2.md). Il concerne uniquement la matinée. Les B2 partent sans préparation et réalisent une one page. Le LLM les accompagne pour définir le projet et les personas, puis organiser les sections et préparer les textes. L’enseignant a choisi de placer la recherche de références et la création du moodboard dès le matin. Les besoins en images, leurs noms de fichiers et leurs emplacements sont préparés ; leur production et la construction du site viennent ensuite. Cette décision plus récente prime sur le placement du moodboard l’après-midi dans les documents de référence, qui n’ont pas été modifiés.

Les slides 1 à 11 sont validées et enregistrées. La slide 3 présente la génération de texte par le LLM. La slide [4.md](modèles,%20interfaces%20et%20usages/4.md), « Le « sampling » du LLM », est validée et enregistrée. Elle explique la sélection du token suivant avec l’exemple « Le chat s’est endormi sur le », puis montre comment chaque choix influence la suite et pourquoi un même prompt peut produire des réponses différentes. Elle remplace la slide sur l’entraînement, rétablie par erreur.

La slide sur les modèles de diffusion est validée et déplacée dans [5.md](modèles,%20interfaces%20et%20usages/5.md). Elle commence par la création d’une image à partir d’un prompt et de bruit aléatoire, puis explique l’entraînement sur des images bruitées. Cet ordre permet de comprendre pourquoi on parle d’images existantes pendant l’entraînement alors que l’utilisateur souhaite créer une nouvelle image.

Le sampling du LLM est présenté séparément de son fonctionnement général, dans la slide 4, avant les modèles de diffusion en slide 5. La slide [6.md](modèles,%20interfaces%20et%20usages/6.md), consacrée au sampling du modèle de diffusion, fait le lien avec la variation des réponses du LLM, puis explique le rôle du bruit de départ et de la seed. L’enseignant a choisi cette version courte, sans développer le sampler ni le nombre d’étapes, car la slide 5 explique déjà le débruitage.

La slide [7.md](modèles,%20interfaces%20et%20usages/7.md), « Les hallucinations », ouvre le bloc « Limites et précautions », prévu sur 20 minutes. Elle distingue les informations inventées, les informations dépassées dans l’exemple d’un tutoriel logiciel et les incohérences visuelles. Elle conseille de demander des sources avec des liens et de cibler des résultats récents lorsque le sujet l’exige. Pour les images, elle aborde la composition du prompt, les retouches successives et les corrections dans Photoshop, notamment par inpainting.

La slide [8.md](modèles,%20interfaces%20et%20usages/8.md), « Les biais », explique comment la formulation du prompt oriente les réponses. Elle aborde la tendance de certains modèles à aller dans le sens de l’utilisateur, puis les représentations courantes associées aux mots d’un prompt d’image, avec l’exemple d’une affiche de luxe. Elle conseille de demander une critique argumentée pour le texte et de donner une direction artistique précise pour les images, sans présenter cette dernière comme un moyen de supprimer tous les biais. Les autres précautions restent à traiter dans la suite du bloc. Le déroulé reste un référentiel neutre, sans notes d’avancement.

La slide [9.md](modèles,%20interfaces%20et%20usages/9.md), « Les données personnelles et confidentielles », commence par la protection des mots de passe, clés d’API et codes de récupération. Elle distingue les principales obligations du RGPD des recommandations de la CNIL et explique l’intérêt des modèles entièrement locaux pour éviter la transmission des documents à un fournisseur externe. Les formulations juridiques doivent rester compréhensibles, sourcées et fidèles aux recommandations, sans présenter le travail local sur un document client comme déconseillé.

La slide [10.md](modèles,%20interfaces%20et%20usages/10.md), « Le droit d’auteur et le droit à l’image », traite des autorisations nécessaires pour réutiliser ou modifier des œuvres et pour diffuser le portrait d’une personne dans un projet de site. Elle distingue l’autorisation du photographe de celle de la personne représentée. Le dernier paragraphe, développé avec l’enseignant, explique que la protection d’une création assistée par IA dépend des choix créatifs humains présents dans le résultat et conseille de conserver les étapes de travail. Les sources consultées sont l’article L122-4 du Code de la propriété intellectuelle, la fiche de Service Public sur le droit à l’image et le rapport du CSPLA du 16 juillet 2026 sur le statut des productions de l’IA ; ce rapport est une analyse du droit existant, pas une nouvelle loi.

La slide [11.md](modèles,%20interfaces%20et%20usages/11.md), « La transparence », distingue les conseils de présentation de l’utilisation, même partielle, de l’IA et l’obligation de signalement des deepfakes dans les usages professionnels concernés par l’AI Act. Elle définit le deepfake sans le limiter aux personnes, précise qu’une mention peut figurer à proximité du contenu plutôt que sur l’image et présente les métadonnées de provenance et les filigranes invisibles. Les sources sont la Commission européenne, C2PA et Google DeepMind. Elle rappelle que la transparence ne remplace pas les autorisations nécessaires et fait le lien avec le PDF de rendu.

L’enseignant a demandé de retirer les tirets médians de la version validée. Les slides 1 à 3 restent les références de style choisies.

## Comment reprendre

Appuie-toi sur ces lectures pour proposer directement une première version adaptée à la demande. Si le sujet est déjà indiqué, rédige ; pose une question seulement si une ambiguïté change réellement le contenu à produire.

Le texte se travaille d’abord dans la conversation. Le fichier est créé ou modifié une fois la formulation validée, sauf demande explicite d’écriture directement dans le fichier. « Il va falloir faire le cours n° 4 » ouvre le travail de rédaction ; ce n’est pas à lui seul une demande d’enregistrement.

Lorsqu’un nouveau contenu est validé et enregistré, mets à jour la section « État du travail à la reprise » pour que la conversation suivante dispose d’un état fidèle. Conserve les références de style choisies ici tant que l’enseignant ne les remplace pas.
