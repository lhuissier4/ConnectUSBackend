# try-a-call

Harnais de test pour la fonctionnalité d'appel (`video-call-signaling`).
Une page statique (`index.html`, JS vanilla, `socket.io-client` via CDN) à
**identité fixe** qui établit une **vraie visio WebRTC** via le namespace
Socket.IO `/call` du backend.

- **Idle** : juste ton identité + un bouton _Appeler_. Aucune vidéo.
- **Appel entrant** : une **popup** Accepter / Refuser.
- **Pendant l'appel** : la vidéo apparaît (pair en grand, ta caméra en incrustation).

L'identité vient de `config.js` (`window.CONFIG`). En Docker, chaque conteneur
régénère ce fichier avec un `userId` fixe.

## Lancer avec Docker (recommandé)

Deux clients pré-identifiés (User 1 sur `:8081`, User 2 sur `:8082`).

1. **Démarrer le backend SUR L'HÔTE** (le seed en dépend) :

   ```bash
   # base de données + migrations
   docker compose -f docker-compose-postgres.yaml up -d
   # backend
   npm run start:dev          # écoute sur :3000
   ```

2. **Lancer les deux clients** (+ création auto de la conversation 1↔2) :

   ```bash
   docker compose -f docker-compose-try-a-call.yaml up
   ```

   Le service `seed-conversation` fait un `POST /conversations` (idempotent) ; il
   patiente si le backend démarre encore (`--retry-connrefused`).

3. **Ouvrir dans le navigateur** (chaque page est déjà identifiée) :
   - <http://localhost:8081> → tu es **User 1 (Alice)**
   - <http://localhost:8082> → tu es **User 2 (Bob)**

## Passer un appel

1. Sur **:8081**, clique **📞 Appeler Bob** → la page **:8082** affiche une **popup**
   « Alice vous appelle… ».
2. Sur **:8082**, clique **✅ Accepter** → la vidéo s'établit des deux côtés.
3. **📕 Raccrocher** d'un côté → l'autre revient à l'écran d'accueil (`call:ended`).

C'est **symétrique** : User 2 peut aussi appeler User 1. Tout est tracé dans le
journal en bas de page (vert = reçu, bleu = émis, rouge = erreur).

## Notes / limites

- **Ordre de démarrage** : le backend hôte doit tourner **avant** le `compose up`,
  sinon la conversation n'est pas créée (le seed finira par abandonner).
- **`host.docker.internal`** : sous Linux, le seed l'atteint via
  `extra_hosts: ["host.docker.internal:host-gateway"]` (déjà dans le compose) ;
  sous Docker Desktop (macOS/Windows) c'est résolu nativement.
- **Modifs de `try-a-call/`** : le conteneur **copie** les fichiers au démarrage →
  relance le conteneur (`docker compose ... up --force-recreate`) pour les voir.
- **Deux caméras sur une même machine** : selon l'OS/navigateur, deux accès caméra
  simultanés peuvent gêner. Décoche **🎥 caméra** avant d'appeler pour un appel
  audio seul, ou teste sur deux machines.
- **CDN** : `socket.io-client` est chargé depuis `cdn.socket.io` (connexion requise).

## Sans Docker (une seule machine, deux onglets)

`getUserMedia` exige un **contexte sécurisé** → sers le dossier via
`http://localhost` (pas `file://`) :

```bash
# crée d'abord la conversation 1↔2 (une fois)
curl -X POST http://localhost:3000/conversations \
  -H 'Content-Type: application/json' -H 'x-requesting-user-id: 1' \
  -d '{"targetUserId":2}'

# sers la page
npx http-server try-a-call -p 8080     # ou: python3 -m http.server 8080 -d try-a-call
```

Ouvre `http://localhost:8080` dans deux onglets. Par défaut `config.js` identifie
**User 1** ; pour incarner User 2 dans le second onglet, édite `config.js`
(`userId: 2, peerId: 1`) — ou utilise simplement la voie Docker ci-dessus.
