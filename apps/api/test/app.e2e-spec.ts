import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters';
import { LoggingInterceptor } from './../src/common/interceptors';
import { PrismaService } from './../src/prisma/prisma.service';

const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
  user: { findUnique: jest.fn(), create: jest.fn() },
  organization: { findUnique: jest.fn(), create: jest.fn() },
  organizationMember: { findMany: jest.fn(), findUnique: jest.fn() },
  knowledgeBase: { findUnique: jest.fn() },
  document: { findUnique: jest.fn() },
  documentChunk: { deleteMany: jest.fn() },
};

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api', { exclude: ['health'] });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.service).toBe('knowhive-api');
          expect(res.body.database).toBe('connected');
        });
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/register should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toBeDefined();
        });
    });

    it('POST /api/auth/register should reject short password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short', name: 'Test' })
        .expect(400);
    });

    it('POST /api/auth/login should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);
    });

    it('GET /api/auth/me should require authentication', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('POST /api/auth/refresh should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('Protected Routes', () => {
    it('GET /api/organizations should require auth', () => {
      return request(app.getHttpServer()).get('/api/organizations').expect(401);
    });

    it('POST /api/organizations should require auth', () => {
      return request(app.getHttpServer())
        .post('/api/organizations')
        .send({ name: 'Test Org' })
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', () => {
      return request(app.getHttpServer())
        .get('/api/nonexistent')
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
        });
    });
  });
});
