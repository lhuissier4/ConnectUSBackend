import { Injectable } from '@nestjs/common';
import { MessageEntity } from './features/message/message.entity';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }
  getGenericMessageInJson() {
    const message = new MessageEntity(
      'id',
      'idconversation',
      'autor',
      new Date('2026-04-14'),
      new Date('2026-04-14'),
      'message',
    );
    return { content: message.getContent() };
  }
}
