import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  await app.init();

  const configService = app.get(ConfigService);
  const port = Number(
    configService.get<string>('API_BACKEND_PORT') ?? process.env.API_BACKEND_PORT ?? 3000,
  );
  console.log(`Le serveur tourne sur le port ${port}`);

  await app.listen(port);
}

bootstrap();