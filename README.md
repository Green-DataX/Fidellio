# Fideliio — site vitrine

Site statique HTML/CSS/JS : sections modulaires chargées avec `fetch` (`js/loader.js`).

## Lancer en local

Le chargement des composants requiert un **serveur HTTP** (pas d’ouverture directe `file://`). Exemple :

```bash
npx serve .
```

Ou utiliser les scripts Java `FidelioServer` / batch fournis dans le dépôt.

## Assets hero

Ajoutez votre capture d’application sous : `img/screen-fideliio.jpeg` (renommez l’ancien fichier `screen fidelio.jpeg` si besoin).

## Langue

La préférence est stockée sous la clé `fideliio-lang` (migration automatique depuis l’ancienne clé `fidelio-lang`).
