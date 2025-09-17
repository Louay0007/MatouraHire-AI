import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Increase body size limits to support up to 20MB payloads (e.g., base64 avatars)
  app.use(json({ limit: '20mb' }));
  app.use(urlencoded({ limit: '20mb', extended: true }));

  app.enableCors({
    origin: (requestOrigin, callback) => {
      callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
