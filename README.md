# Exercice d'Anglais pour Français — version mobile (v1.0.1-web)

Application web installable (PWA) qui reprend le logiciel Windows « Exercice d'Anglais pour Français » v1.0.1 :
**28 245 exercices** d'anglais du niveau **A1 au niveau Expert**, avec traduction et correction en français.
Elle **fonctionne hors ligne** sur téléphone (Android, iPhone) une fois ouverte une première fois avec Internet.

## Fonctions reprises
- Profils multiples, séries par niveau et par catégorie (12 catégories), « Tout mixer », taille de série
- QCM, textes à trous, dictées, remise en ordre, « Trouver l'image » (emojis), oral au micro
- Correction : bonne réponse, explication FR + EN, API, écoute normale et lente mot par mot
- Orthographe britannique, contractions et accents acceptés comme dans la version Windows
- Révision espacée (boîtes de Leitner 1-3-7-21-60 jours), test de niveau (18 questions), examen blanc chronométré,
  expression écrite notée (partielle, /25), historique et graphiques, mots à retravailler en prononciation
- Mes exercices (ajout, import/export JSON), sauvegarde/restauration de profil, attestation imprimable (PDF)
- Interface français / anglais, voix américaine ou britannique, vitesse de la voix

## Différences avec la version Windows
- **Voix** : synthèse vocale du téléphone (hors ligne si une voix anglaise est installée).
- **Oral au micro** : reconnaissance vocale du navigateur (Chrome Android, Safari iPhone). Selon le téléphone,
  elle peut demander Internet ; sinon on peut passer l'exercice ou désactiver l'oral dans le menu.
- **Photos** : non incluses (les images sont des emojis).
- **Progression** : enregistrée dans le téléphone (navigateur). Utilisez « Sauvegarder mon profil » pour la garder.

## Mettre en ligne avec GitHub Pages
1. Créez un dépôt sur GitHub et envoyez-y tous les fichiers de ce dossier (à la racine).
2. Dépôt › **Settings › Pages** › Source : *Deploy from a branch*, branche `main`, dossier `/ (root)` › Save.
3. Après 1 à 2 minutes, l'adresse `https://<votre-nom>.github.io/<dépôt>/` s'affiche.
4. Ouvrez-la sur le téléphone, attendez « ✅ Disponible hors ligne », puis :
   - Android (Chrome) : bouton « 📲 Installer l'application » ou menu ⋮ › *Installer l'application* ;
   - iPhone (Safari) : Partager ⬆️ › *Sur l'écran d'accueil*.

## Mise à jour du code
Après toute modification de `index.html`, `css/` ou `js/`, changez `SHELL_VERSION` dans `sw.js`.
Si les exercices (`data/*.json`) changent, changez `DATA_CACHE` dans `sw.js` **et** dans `js/app.js`.

## Tester sur ordinateur
    python -m http.server 8000      puis ouvrir http://localhost:8000

## Limites
Les mêmes que la version Windows : exercices en grande partie générés à partir de listes, vérifiés automatiquement
mais pas relus un par un par un enseignant ; note de prononciation = intelligibilité ; note d'écriture partielle ;
examen blanc et attestation sans valeur officielle. Dictionnaire CMU (licence de type BSD) utilisé pour l'API.
