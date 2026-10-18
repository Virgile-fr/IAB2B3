# Présentation du cours — sans installation

1. Ouvrir **`index.html`**, à la racine, par double-clic dans un navigateur.
2. Cliquer sur **Ouvrir le dossier du cours**.
3. Choisir **`B2&B3DG`** et autoriser sa lecture.

Aucun serveur, terminal, Python ou accès Internet n'est nécessaire. Les scripts et les styles sont inclus dans le dossier. Aucun fichier source n'est modifié par le site.

Le navigateur demande de sélectionner le dossier pour autoriser sa lecture, même lorsque `index.html` se trouve à côté. Ce choix est à refaire après fermeture ou rechargement de la page.

## Modifier le cours

Avec la lecture directe des dossiers, proposée notamment par Chrome et Edge, le site relit les fichiers toutes les deux secondes. Les modifications, ajouts et suppressions de slides et de visuels apparaissent sans rechargement. Le bouton **Recharger le dossier**, dans les commandes flottantes, permet de le sélectionner à nouveau.

Si cette fonction n'est pas disponible, utiliser **Importer une copie du dossier**. Ce mode n'est pas synchronisé : cliquer sur **Recharger le dossier** et le resélectionner après avoir modifié les fichiers. Référence : [accès aux fichiers et autorisations du navigateur](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access).

Les dossiers vides n'apparaissent pas. Les fichiers du premier niveau (`syllabus.md`, consignes, etc.) ne sont pas proposés. Les dossiers et fichiers nommés « avant de commencer », « déroullé », « déroulé » ou « introduction » sont exclus.

Dans chaque cours, les fichiers commençant par un numéro sont triés par valeur numérique (`0`, `1`, `2`, …, `10`, `11`), puis les autres par ordre alphabétique (`B2`, `B3`, …). Un fichier Markdown correspond à une slide. Aucun texte source n'est modifié.

Placer les images dans le dossier `images` du cours, avec le même nom que la slide : `5.md` → `images/5.gif`. Les variantes `5-link.png`, `5-schema.png` ou `5_detail.jpg` sont aussi proposées sur la même slide, avec des boutons pour passer d'un visuel à l'autre. Cliquer sur le visuel l'agrandit. Les GIF restent animés. Sans image associée, le texte passe en deux colonnes.

La présentation est composée pour la projection en 16:9 et remplit toute la fenêtre, en s'adaptant aux autres proportions d'écran. Le plein écran du navigateur est demandé à la sélection du dossier ; `F` permet de le réactiver si nécessaire. Il n'y a pas de barre permanente en haut ou en bas.

Le thème associe un fond sombre à des accents menthe claire. Un bandeau fin vertical à gauche porte la mention « Intelligence artificielle / Design graphique » et le numéro de page. Sur la couverture, le texte se superpose au visuel. Sur les autres slides illustrées, l'image reste à droite et le texte prend l'espace restant, avec des marges intérieures augmentées de 20 %. Chaque image dispose d'un léger retrait de 14 px, de coins arrondis de 10 px et d'un contour menthe de 1 px. Cliquer sur une image permet de la voir en entier. Sans visuel, le texte est réparti sur deux colonnes. La taille du texte s'ajuste à l'espace disponible ; un contenu exceptionnellement long reste accessible par défilement.

Les changements de page utilisent un fondu de 420 ms, avec un léger déplacement du texte. La préférence système de réduction des animations est respectée.

## Navigation

Bouger la souris ou toucher l'écran fait apparaître les seules commandes flottantes : précédent, suivant, **Sommaire** et **Recharger le dossier**. Elles disparaissent après 1,8 seconde sans activité ; elles restent accessibles au clavier avec Tabulation. Pour une slide avec plusieurs visuels, leurs flèches apparaissent aussi au mouvement de la souris.

- Flèches gauche/droite, Page précédente/suivante, espace : changer de slide.
- Début / Fin : première / dernière slide du cours.
- `F` : plein écran ; `Échap` : quitter le plein écran ou fermer une fenêtre.
- Sommaire : choisir le cours ou une slide.
- Sur écran tactile : balayage horizontal.

L'adresse conserve la slide sélectionnée et peut être copiée pour la retrouver.

## Ancienne version avec serveur, facultative

Le serveur Python reste utilisable avec `python3 server.py`, puis **http://127.0.0.1:8000**. Si le moteur Markdown manque : `python3 -m pip install -r requirements.txt`. Il n'est pas nécessaire pour ouvrir directement `index.html`.

Le serveur écoute uniquement sur cet ordinateur par défaut. Pour une utilisation sur un réseau local :

```sh
python3 server.py --host 0.0.0.0 --port 8000
```

Utiliser alors l'adresse IP de cet ordinateur, port 8000. Ce serveur local ne publie pas le cours sur Internet. Une version hébergée devra recevoir les fichiers mis à jour pour suivre les modifications locales.

## Vérification

```sh
python3 -m unittest discover -p 'test_*.py'
```

## Bibliothèques incluses

Le rendu Markdown utilise Marked 16.4.2, et le HTML est nettoyé par DOMPurify 3.2.7. Les fichiers et leurs licences sont dans `vendor`.

## GitHub Pages

Conserver la racine du projet dans le dépôt : `index.html`, les scripts, `vendor`, `build_pages.py`, `.github/workflows/pages.yml` et `B2&B3DG`. Dans Settings > Pages > Source, choisir **GitHub Actions**. Le workflow publie automatiquement les mises à jour de la branche par défaut.

En ligne, les Markdown et les images se chargent sans sélection du dossier. La liste est régénérée à chaque publication, y compris pour les ajouts et suppressions. Les liens fonctionnent aussi sous le nom du dépôt. Les documents Markdown à la racine de B2&B3DG ne sont pas inclus dans le site généré.

L'ouverture directe de `index.html` sur le PC conserve la sélection du dossier. Le serveur Python facultatif reste compatible. Pour prévisualiser la publication statique : `python3 build_pages.py`, puis `python3 -m http.server --directory _site 8001` et ouvrir http://localhost:8001.
