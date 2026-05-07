import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

let app: any;

async function bootstrap() {
  if (app) return app;

  app = await NestFactory.create(AppModule);

  // Sem prefixo global — o roteamento é feito pelo vercel.json
  // Os controllers já têm seus prefixos próprios (ex: /auth, /militares)
  // O frontend chamará /api/v1/auth/login e o VITE_API_URL aponta para
  // a URL base do backend, então o axios chama baseURL + /auth/login

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173',
      'https://controle-reserva.vercel.app',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
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

// Handler serverless para Vercel
export default async function handler(req: any, res: any) {
  const nestApp = await bootstrap();
  const expressApp = nestApp.getHttpAdapter().getInstance();
  expressApp(req, res);
}

// Servidor local para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  bootstrap().then(async (nestApp) => {
    await nestApp.listen(3000);
    console.log('Backend rodando em http://localhost:3000');
  });
}
