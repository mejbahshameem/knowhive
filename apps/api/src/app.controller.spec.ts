import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const mockAppService = {
  getHealth: jest.fn(),
};

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: AppService, useValue: mockAppService }],
    }).compile();

    controller = module.get<AppController>(AppController);
    jest.clearAllMocks();
  });

  describe('getHealth', () => {
    it('should return health status from service', async () => {
      const healthResponse = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'knowhive-api',
        database: 'connected',
      };
      mockAppService.getHealth.mockResolvedValue(healthResponse);

      const result = await controller.getHealth();

      expect(result).toEqual(healthResponse);
      expect(mockAppService.getHealth).toHaveBeenCalled();
    });
  });
});
