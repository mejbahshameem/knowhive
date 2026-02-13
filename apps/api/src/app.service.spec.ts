import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

const mockPrismaService = {
  $queryRaw: jest.fn(),
};

describe('AppService', () => {
  let service: AppService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AppService>(AppService);
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return ok status when database is connected', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

      const result = await service.getHealth();

      expect(result.status).toBe('ok');
      expect(result.service).toBe('atlasai-api');
      expect(result.database).toBe('connected');
      expect(result.timestamp).toBeDefined();
    });

    it('should return error status when database is disconnected', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await service.getHealth();

      expect(result.status).toBe('error');
      expect(result.service).toBe('atlasai-api');
      expect(result.database).toBe('disconnected');
    });
  });
});
