import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { Request, Response } from 'express';

let app: any;

async function bootstrap() {
  if (app) return app;

  app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://controle-reserva.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  await app.init();
  return app;
}

export default async function handler(req: Request, res: Response) {
  // Responder preflight OPTIONS diretamente, antes do NestJS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://controle-reserva.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(204).end();
    return;
  }

  const nestApp = await bootstrap();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  expressApp(req, res);
}

if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(async (nestApp) => {
    await nestApp.listen(3000);
    console.log('Backend rodando em http://localhost:3000');
  });
}