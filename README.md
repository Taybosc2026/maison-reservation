# Site de réservation de maison de campagne

Ce pack contient un petit site React + Vite, connecté à Supabase, pour permettre à la famille et aux amis de réserver une des 4 chambres d'amis.

## 1. Contenu du projet

```text
maison-reservation-supabase/
├── .env.example
├── index.html
├── package.json
├── README.md
├── vite.config.js
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
└── supabase/
    └── schema.sql
```

## 2. Prérequis

- Node.js 20.19+ ou 22.12+
- un compte Supabase
- un compte Vercel ou Netlify pour publier le site

## 3. Installation locale

Ouvrir un terminal dans le dossier du projet puis lancer :

```bash
npm install
```

Créer ensuite un fichier `.env` à partir de `.env.example`.

## 4. Mise en place côté Supabase

### Étape 1 — créer le projet

1. Aller sur Supabase et créer un nouveau projet.
2. Attendre que le projet soit prêt.

### Étape 2 — créer la table et les règles d'accès

1. Ouvrir **SQL Editor**.
2. Créer une nouvelle requête.
3. Copier-coller le contenu de `supabase/schema.sql`.
4. Cliquer sur **Run**.

### Étape 3 — récupérer les clés du projet

Dans Supabase, récupérer :

- l'URL du projet
- la clé `anon`

Puis remplir le fichier `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_SHARED_PASSWORD=mot-de-passe-famille
```

## 5. Tester en local

Lancer :

```bash
npm run dev
```

Ouvrir ensuite l'adresse indiquée dans le terminal.

## 6. Construire le site

Pour vérifier que tout compile bien :

```bash
npm run build
```

Le site prêt à publier sera généré dans le dossier `dist/`.

## 7. Publication sur Vercel

### Méthode simple

1. Mettre ce projet dans un dépôt GitHub.
2. Connecter GitHub à Vercel.
3. Importer le dépôt dans Vercel.
4. Dans les variables d'environnement du projet Vercel, ajouter :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SHARED_PASSWORD`
5. Lancer le déploiement.

Réglages attendus :

- Build command : `npm run build`
- Output directory : `dist`

## 8. Publication sur Netlify

1. Mettre ce projet dans un dépôt GitHub.
2. Connecter GitHub à Netlify.
3. Créer un nouveau site depuis le dépôt.
4. Ajouter les variables d'environnement :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SHARED_PASSWORD`
5. Vérifier les réglages suivants :
   - Build command : `npm run build`
   - Publish directory : `dist`
6. Déployer.

## 9. Important sur la sécurité

Ce site est adapté à un usage simple entre proches.

Le mot de passe partagé protège l'interface, mais il ne constitue pas une sécurité forte. Les politiques SQL incluses permettent à l'application web d'utiliser la clé `anon` de Supabase pour lire, créer et supprimer des réservations. Pour un niveau de sécurité élevé, il faudrait passer à une vraie authentification utilisateur ou à un backend intermédiaire.

## 10. Personnalisation rapide

Dans `src/App.jsx`, vous pouvez modifier :

- le nom des chambres
- les textes affichés
- le mot de passe par défaut de démonstration

Dans `src/styles.css`, vous pouvez modifier :

- les couleurs
- l'espacement
- le rendu mobile

## 11. Utilisation quotidienne

- les proches entrent le mot de passe commun
- ils consultent les périodes libres
- ils réservent une chambre avec leur nom et des dates
- les autres utilisateurs voient la réservation après actualisation, ou automatiquement si la connexion temps réel fonctionne
