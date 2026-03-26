import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { LoggingInterceptor } from './common/interceptors';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AtlasAI API')
    .setDescription(
      'AI powered knowledge base platform. Organize documents into knowledge bases, ' +
        'generate vector embeddings, and perform semantic search across your content.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Health', 'Application health checks')
    .addTag('Auth', 'Authentication and user management')
    .addTag('Organizations', 'Organization CRUD and membership')
    .addTag('Knowledge Bases', 'Knowledge base management within organizations')
    .addTag('Documents', 'Document management within knowledge bases')
    .addTag('Search', 'AI powered semantic search')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'AtlasAI API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      tagsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
