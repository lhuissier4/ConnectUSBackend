# ConnectUS
Projet Open Innov de l'EPSI

Il s'agit d'un projet NestJS initialisé avec `nest new backend`

# Dévelopement

## Initialiser le projet
```bash
npm i 
```
## Démarrer l'application

Pour lancer le projet, executez :
```bash
npm start
```

# Résumé des endpoints

> La plupart des routes attendent l'en-tête `x-requesting-user-id` (identifiant
> de l'utilisateur appelant). Les paramètres `:id` / `:conversationId` sont des
> entiers.

## REST

### Application
| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Message de santé (« Hello World »). |

### Utilisateurs (`/users`)
| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/users/search?firstName=&lastName=` | Recherche d'utilisateurs par prénom / nom. |
| `GET` | `/users/:id/card` | Carte (profil résumé) d'un utilisateur. |
| `GET` | `/users/:id` | Détail d'un utilisateur. |
| `POST` | `/users` | Création d'un utilisateur. En-tête `x-requesting-user-id`. Corps : `UserDto`. |
| `DELETE` | `/users/:id` | Suppression d'un utilisateur. En-tête `x-requesting-user-id`. |

`UserDto` : `firstName`, `lastName`, `email`, `passwordHash`, `statusInSchool`,
`isAdmin`, et optionnels `phoneNumber`, `photoUrl`, `rgpdPreferences`,
`currentCourse`, `studentClass` (requis si `statusInSchool = STUDENT`).

### Conversations & messages (`/conversations`)
| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/conversations` | Crée (ou récupère) une conversation. Corps : `{ targetUserId }`. Renvoie `201` si créée, `200` sinon. |
| `GET` | `/conversations` | Liste les conversations de l'utilisateur appelant. |
| `GET` | `/conversations/:id/messages?limit=&before=` | Messages d'une conversation (pagination par `limit` / `before`). |
| `POST` | `/conversations/:id/messages` | Envoie un message. Corps : `{ content, responseToMessageId? }`. |

### Appels (`/conversations/:conversationId/calls`)
| Méthode | Route | Description |
| --- | --- | --- |
| `GET` | `/conversations/:conversationId/calls?limit=&before=` | Historique des appels d'une conversation. |
| `GET` | `/conversations/:conversationId/calls/active` | Appel actif courant de la conversation. |

## WebSocket (Socket.IO)

L'identifiant utilisateur est fourni dans le handshake (`auth.userId` ou
`query.userId`).

### Namespace `/chat`
| Sens | Event | Payload |
| --- | --- | --- |
| → serveur | `send` | `{ conversationId, content, responseToMessageId? }` |
| ← client | `message:new` | Message diffusé à chaque participant |

### Namespace `/call`
| Sens | Event | Payload |
| --- | --- | --- |
| → serveur | `call:initiate` | `{ conversationId, type }` (`video` / `audio`) |
| → serveur | `call:accept` / `call:decline` / `call:hangup` / `call:join` | `{ callId }` |
| → serveur | `signal:offer` / `signal:answer` | `{ callId, sdp }` |
| → serveur | `signal:ice` | `{ callId, candidate }` |
| ← client | `call:incoming` | `{ callId, callerId, callerName, type, conversationId }` |
| ← client | `call:accepted` / `call:declined` / `call:joined` / `call:missed` | `{ callId, ... }` |
| ← client | `call:ended` | `{ callId, reason }` |
| ← client | `signal:offer` / `signal:answer` / `signal:ice` | Relais du pair |

> Minuteries : 30 s de sonnerie (→ `MISSED`), puis 5 min de fenêtre de reprise
> (→ `ENDED`).

### Comptes insérés
Leurs mot de passe hashé est password

story telling

personnas (cahier des charges)
nom prenom ages (metier( etudiant))
besion et contraintes
outils utilisé aujourd'hui
comment on utiliserait l'application

oral de 10min (demonstration comprise)
7 d'oral + 3 de démo
problématique => commentcer l'oral avec une problématique (storie telling + personna)
solution => reponse problématique (3-4min)
bisness plan 1min-1min30
démo de l'appli

oral en juin
