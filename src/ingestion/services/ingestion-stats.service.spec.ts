// ingestion/services/ingestion-stats.service.spec.ts

import { IngestionStatsService } from './ingestion-stats.service';
import { IIngestionReadRepo } from '../interfaces/ingestion-repositories';
import { IngestionJob } from '../models/ingestion_jobs.model';

describe('IngestionStatsService', () => {
  let service: IngestionStatsService;
  let repo: jest.Mocked<IIngestionReadRepo>;

  beforeEach(() => {
    repo = {
      findAll: jest.fn(),
    } as unknown as jest.Mocked<IIngestionReadRepo>;

    service = new IngestionStatsService(repo);
  });

  it('should return the array length when repo.findAll returns an array', async () => {
    const dummyArray = [ {}, {}, {} ] as unknown as any[];
    repo.findAll.mockResolvedValueOnce(dummyArray);

    await expect(service.getStats()).resolves.toBe(3);
    expect(repo.findAll).toHaveBeenCalledWith({ offset: 0, limit: 1_000_000 });
  });

  it('should return undefined when repo.findAll returns undefined', async () => {
    repo.findAll.mockResolvedValueOnce(undefined as unknown as IngestionJob[]);

    await expect(service.getStats()).resolves.toBeUndefined();
    expect(repo.findAll).toHaveBeenCalledWith({ offset: 0, limit: 1_000_000 });
  });

  it('should propagate errors from repo.findAll', async () => {
    const error = new Error('DB failure');
    repo.findAll.mockRejectedValueOnce(error);

    await expect(service.getStats()).rejects.toThrow('DB failure');
    expect(repo.findAll).toHaveBeenCalledWith({ offset: 0, limit: 1_000_000 });
  });
});
