import { Test, TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service';
import { PythonBackendHttpClient } from './python-backend.http-client.service';


describe('StatsService', () => {
  let service: StatsService;
  let client: jest.Mocked<PythonBackendHttpClient>;

  beforeEach(async () => {
    const clientMock = {
      request: jest.fn(),
    } as Partial<jest.Mocked<PythonBackendHttpClient>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatsService,
        {
          provide: PythonBackendHttpClient,
          useValue: clientMock,
        },
      ],
    }).compile();

    service = module.get<StatsService>(StatsService);
    client = module.get(PythonBackendHttpClient) as jest.Mocked<PythonBackendHttpClient>;
  });

  describe('healthCheck', () => {
    it('should return true when backend returns status "ok"', async () => {
      client.request.mockResolvedValue({ status: 'ok' });
      await expect(service.healthCheck()).resolves.toBe(true);
      expect(client.request).toHaveBeenCalledWith('get', '/health');
    });

    it('should return false when backend returns any other status', async () => {
      client.request.mockResolvedValue({ status: 'error' });
      await expect(service.healthCheck()).resolves.toBe(false);
      expect(client.request).toHaveBeenCalledWith('get', '/health');
    });

    it('should propagate errors from the client', async () => {
      const err = new Error('network down');
      client.request.mockRejectedValue(err);
      await expect(service.healthCheck()).rejects.toThrow('network down');
      expect(client.request).toHaveBeenCalledWith('get', '/health');
    });
  });

  describe('getSystemStats', () => {
    it('should return the stats object on success', async () => {
      const stats = { load: 0.42, uptime: 3600 };
      client.request.mockResolvedValue(stats);
      await expect(service.getSystemStats()).resolves.toEqual(stats);
      expect(client.request).toHaveBeenCalledWith('get', '/api/stats');
    });

    it('should propagate errors from the client', async () => {
      const err = new Error('service unavailable');
      client.request.mockRejectedValue(err);
      await expect(service.getSystemStats()).rejects.toThrow('service unavailable');
      expect(client.request).toHaveBeenCalledWith('get', '/api/stats');
    });
  });
});