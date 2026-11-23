# Portfolio — Antoine, graphiste freelance

Site statique (HTML, CSS, JavaScript), sans framework ni build.

```
portfolio/
├── index.html        ← la structure du site
├── projets.json      ← la liste des créations affichées dans la galerie
├── site.json         ← tes textes (accroche, à propos) et tes contacts
├── admin/            ← le panel admin
├── css/style.css     ← le design (couleur d'accent : variable --accent en haut)
├── js/main.js        ← galerie, filtres, lightbox, animations
└── images/
    ├── pdp/
    ├── miniatures/
    ├── bannieres/
    └── 3d/
```

## Le panel admin (le plus simple)

Adresse : **https://tdtpgnpk88-svg.github.io/portfolio/admin/**

Il permet, sans toucher au code :
- d'ajouter une création (glisser une image, choisir un titre et une catégorie) ;
  les grosses images sont réduites et converties automatiquement ;
- de renommer, réordonner ou supprimer tes créations ;
- de régler l'aperçu de ta chaîne en haut du site (nom, pseudo YouTube, abonnés,
  photo de profil, bannière, et les 3 vidéos avec miniature, titre et durée)
  et l'image de l'offre ;
- de modifier tes textes (accroche, sous-titre, à propos) et tes contacts.

Rien ne change sur le site tant que tu n'as pas cliqué sur **Publier**. Ensuite, le site
se met à jour en 1 à 2 minutes.

**Connexion** : le site n'a pas de serveur, donc le panel se connecte à ton compte GitHub
avec un *jeton* (une sorte de mot de passe limité à ce dépôt). À créer une seule fois :

1. Va sur https://github.com/settings/personal-access-tokens/new
2. Nom : « Admin portfolio ». Expiration : celle que tu veux (à renouveler ensuite).
3. *Repository access* : **Only select repositories**, puis `portfolio`.
4. *Permissions* : **Contents** sur **Read and write**. Rien d'autre.
5. *Generate token*, copie-le et colle-le dans le panel.

Le jeton reste dans ton navigateur. Ne le partage avec personne. S'il fuit, supprime-le
sur la même page GitHub et crée-en un nouveau.

Si tu modifies aussi les fichiers sur ton PC, fais d'abord `git pull` pour récupérer ce
que le panel a publié, sinon ton `git push` sera refusé.

## Ajouter une création à la main

1. Exporte ton image depuis Photoshop ou Blender en **JPG ou WebP**, autour de
   1600 px de large au maximum (≈ 200 à 400 Ko). Le site reste ainsi rapide sur mobile.
2. Range-la dans le bon dossier, par exemple `images/miniatures/minecraft-hardcore.jpg`.
   Évite les espaces et les accents dans le nom du fichier.
3. Ouvre `projets.json` et ajoute un bloc **en haut de la liste** (les premiers
   apparaissent en premier) :

   ```json
   [
     {
       "titre": "Miniature — Minecraft Hardcore",
       "categorie": "miniatures",
       "image": "images/miniatures/minecraft-hardcore.jpg"
     },
     { "...": "les créations déjà présentes" }
   ]
   ```

   - `categorie` vaut `pdp`, `miniatures`, `bannieres` ou `3d`.
   - Chaque bloc est séparé du suivant par une **virgule**, et le dernier n'en a pas.
     Si la galerie affiche une erreur, c'est presque toujours une virgule en trop ou
     en moins. Tu peux coller ton fichier sur https://jsonlint.com pour vérifier.
4. Enregistre, puis publie (voir plus bas). La création apparaît toute seule.

Le haut de la page se remplit aussi avec `projets.json` : l'aperçu de chaîne utilise
la **1re bannière**, la **1re PDP** et les **3 premières miniatures** de la liste, et la
section Offre affiche la **2e PDP**. Mets donc tes plus belles créations en haut de chaque
catégorie. Les dimensions affichées sous chaque image (« 1280 × 720 ») sont lues
automatiquement dans le fichier.

Pour retirer les placeholders, supprime leurs blocs dans `projets.json` et les fichiers
`.svg` dans `images/`.

## Tester le site sur ton PC

La galerie lit `projets.json`. Or le navigateur bloque cette lecture si tu ouvres
`index.html` par un double-clic. Il faut passer par un petit serveur local :

- **VS Code** : installe l'extension « Live Server », clic droit sur `index.html`
  puis « Open with Live Server ».
- **ou Python** : dans un terminal ouvert dans le dossier, lance
  `python -m http.server 8000`, puis ouvre http://localhost:8000

## Mettre le site en ligne sur GitHub Pages

1. Crée un compte sur https://github.com si tu n'en as pas.
2. Crée un nouveau dépôt **public** (bouton « New »). Si tu l'appelles
   `TON_PSEUDO.github.io`, le site sera à l'adresse `https://TON_PSEUDO.github.io`.
   Avec un autre nom, par exemple `portfolio`, il sera à
   `https://TON_PSEUDO.github.io/portfolio`.
3. Envoie les fichiers :
   - **sans ligne de commande** : sur la page du dépôt, « Add file » puis
     « Upload files », glisse **le contenu** du dossier `portfolio` (pas le dossier
     lui-même, `index.html` doit être à la racine), puis « Commit changes » ;
   - **avec Git** :
     ```bash
     git init
     git add .
     git commit -m "Premier portfolio"
     git branch -M main
     git remote add origin https://github.com/TON_PSEUDO/NOM_DU_DEPOT.git
     git push -u origin main
     ```
4. Dans le dépôt : **Settings**, puis **Pages**. Sous « Build and deployment »,
   choisis *Source : Deploy from a branch*, *Branch : main* et le dossier */ (root)*,
   puis « Save ».
5. Attends une ou deux minutes : l'adresse du site s'affiche en haut de la page
   *Pages*. À chaque nouvel envoi (upload ou `git push`), le site se met à jour tout seul.

## À personnaliser avant de partager le lien

- Tes contacts (Instagram, Discord, email) et tes textes se changent dans le panel
  admin, sections **Contact** et **Textes**, ou à la main dans `site.json`.
  Ton ID Discord : Paramètres, Avancés, active le « Mode développeur », puis clic
  droit sur ton profil et « Copier l'identifiant de l'utilisateur ». Sans ID, un clic
  sur la carte Discord copie ton pseudo.
- Pour passer au violet : dans `css/style.css`, remplace `--accent: #22e4ff;` par
  `--accent: #b48cff;` et `--accent-ink: #04161b;` par `--accent-ink: #1a0d33;`.
  Pense aussi à la couleur de survol du bouton (`.btn--primary:hover`).
- Le nombre d'abonnés et les durées de vidéos de l'aperçu de chaîne (en haut de
  `index.html`) sont des exemples : tu peux les changer librement.
