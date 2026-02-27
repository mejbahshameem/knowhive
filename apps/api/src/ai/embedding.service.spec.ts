import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EmbeddingService } from './embedding.service';

const mockConfigService = {
  get: jest.fn(),
};

describe('EmbeddingService', () => {
  describe('without API key', () => {
    let service: EmbeddingService;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue(undefined);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmbeddingService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<EmbeddingService>(EmbeddingService);
    });

    it('should report as unavailable', () => {
      expect(service.isAvailable).toBe(false);
    });

    it('should throw error on embed() call', async () => {
      await expect(service.embed('test')).rejects.toThrow(
        'Embedding service unavailable',
      );
    });

    it('should throw error on embedBatch() call', async () => {
      await expect(service.embedBatch(['test'])).rejects.toThrow(
        'Embedding service unavailable',
      );
    });
  });

  describe('with API key', () => {
    let service: EmbeddingService;

    beforeEach(async () => {
      mockConfigService.get.mockReturnValue('test-api-key');

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          EmbeddingService,
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      service = module.get<EmbeddingService>(EmbeddingService);
    });

    it('should report as available', () => {
      expect(service.isAvailable).toBe(true);
    });
  });
});
