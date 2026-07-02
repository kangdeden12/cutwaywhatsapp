import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validasi otomatis semua DTO masuk sesuai aturan class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // buang field yang tidak dikenal
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`CutwayWhatsApp backend berjalan di http://localhost:${port}/api/v1`);
}

bootstrap();
