// Identité du client, injectée au démarrage du conteneur nginx
// (voir docker-compose-try-a-call.yaml : le entrypoint régénère ce fichier
// à partir des variables USER_ID / PEER_ID / CONVERSATION_ID / SERVER_URL).
//
// Ces valeurs par défaut correspondent au client 1 et permettent aussi d'ouvrir
// la page directement (hors Docker) sans rien configurer.
window.CONFIG = {
  userId: 1,
  peerId: 2,
  conversationId: 1,
  // http:// : socket.io négocie lui-même la montée en WebSocket. Un schéma
  // ws:// déclenche un "websocket error" côté socket.io-client.
  serverUrl: 'http://localhost:5555',
};
