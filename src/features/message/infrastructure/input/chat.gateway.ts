import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  MESSAGE_CREATED_EVENT,
  MessageCreatedEvent,
} from '../../application/events/message-created.event';
import type { IConversationRepository } from '../../application/ports/conversation.repository.port';
import { CONVERSATION_REPOSITORY_PORT } from '../../application/ports/conversation.repository.port';
import { SendMessageUseCase } from '../../application/use-cases/send-message.usecase';

interface SendMessagePayload {
  conversationId: number;
  content: string;
  responseToMessageId?: number;
}

interface ChatSocketData {
  userId?: number;
}

const roomFor = (conversationId: number): string =>
  `conversation:${conversationId}`;

/**
 * Gateway temps réel (Socket.IO, namespace /chat).
 * - À la connexion, l'utilisateur (identifié dans le handshake) est auto-rejoint
 *   aux rooms de toutes ses conversations (appartenance figée à la création).
 * - L'event entrant `send` passe par le MÊME SendMessageUseCase que le REST.
 * - À chaque message créé (REST ou WS), `@OnEvent` diffuse `message:new` à la room.
 */
@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;

  constructor(
    @Inject(CONVERSATION_REPOSITORY_PORT)
    private readonly conversationRepository: IConversationRepository,
    private readonly sendMessageUseCase: SendMessageUseCase,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const userId = this.resolveUserId(client);
    if (userId === null) {
      client.disconnect(true);
      return;
    }

    (client.data as ChatSocketData).userId = userId;
    const conversations = await this.conversationRepository.listForUser(userId);
    for (const conversation of conversations) {
      await client.join(roomFor(conversation.id));
    }
  }

  @SubscribeMessage('send')
  async handleSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const userId = (client.data as ChatSocketData).userId;
    if (userId === undefined) {
      return { error: 'Utilisateur non identifié.' };
    }
    // Le use-case valide l'appartenance puis émet l'event → diffusion via @OnEvent.
    return this.sendMessageUseCase.execute(
      userId,
      payload.conversationId,
      payload.content,
      payload.responseToMessageId,
    );
  }

  @OnEvent(MESSAGE_CREATED_EVENT)
  broadcastMessage(event: MessageCreatedEvent): void {
    this.server
      .to(roomFor(event.conversationId))
      .emit('message:new', event.message);
  }

  private resolveUserId(client: Socket): number | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    const query = client.handshake.query as Record<string, unknown>;
    const raw = auth?.userId ?? query?.userId;
    const userId = Number(raw);
    return raw !== undefined && raw !== null && !Number.isNaN(userId)
      ? userId
      : null;
  }
}
