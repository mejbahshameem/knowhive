import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  // Global prefix: all routes start with /api except health check
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`🚀 AtlasAI API running on http://localhost:${port}`);
}
bootstrap();
