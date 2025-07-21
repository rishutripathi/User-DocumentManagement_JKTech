// ingestion/services/ingestion-query.service.spec.ts

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { IngestionQueryService } from './ingestion-query.service';
import { IIngestionReadRepo } from '../interfaces/ingestion-repositories';
import { GetIngestionJobsFilterDto } from '../DTO/ingestion.dto';
import { IngestionJob } from '../models/ingestion_jobs.model';

describe('IngestionQueryService', () => {
  let service: IngestionQueryService;
  let repo: jest.Mocked<IIngestionReadRepo>;

  beforeEach(() => {
    repo = {
      findAllWithCount: jest.fn(),
      findById:         jest.fn(),
      findByUser:       jest.fn(),
    } as any;

    service = new IngestionQueryService(repo);
  });

  describe('list()', () => {
    it('should return paginated jobs and correct pagination metadata', async () => {
      const dummyJobs = [
        { id: 1, triggeredById: 10 },
        { id: 2, triggeredById: 11 },
      ] as unknown as IngestionJob[];

      repo.findAllWithCount.mockResolvedValueOnce([dummyJobs, 5]);

      const filter: GetIngestionJobsFilterDto = { page: 2, limit: 2 };
      const result = await service.list({} as any, filter);

      expect(repo.findAllWithCount).toHaveBeenCalledWith({ offset: 2, limit: 2 });
      expect(result.jobs).toBe(dummyJobs);
      expect(result.pagination).toEqual({
        totalItems:   5,
        itemCount:    2,
        itemsPerPage: 2,
        totalPages:   3,
        currentPage:  2,
      });
    });
  });

  describe('getById()', () => {
    const adminUser  = { id: 100, role: 'admin' } as any;
    const normalUser = { id: 200, role: 'user'  } as any;

    it('should return the job for an admin user', async () => {
      const job = { id: 1, triggeredById: 999 } as unknown as IngestionJob;
      repo.findById.mockResolvedValueOnce(job);

      await expect(service.getById(adminUser, 1)).resolves.toBe(job);
      expect(repo.findById).toHaveBeenCalledWith(1);
    });

    it('should return the job if user triggered it', async () => {
      const job = { id: 2, triggeredById: normalUser.id } as unknown as IngestionJob;
      repo.findById.mockResolvedValueOnce(job);

      await expect(service.getById(normalUser, 2)).resolves.toBe(job);
      expect(repo.findById).toHaveBeenCalledWith(2);
    });

    it('should throw ForbiddenException if non-admin user did not trigger the job', async () => {
      const job = { id: 3, triggeredById: 999 } as unknown as IngestionJob;
      repo.findById.mockResolvedValueOnce(job);

      await expect(service.getById(normalUser, 3)).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.findById).toHaveBeenCalledWith(3);
    });

    it('should throw NotFoundException if job does not exist', async () => {
      repo.findById.mockResolvedValueOnce(null);

      await expect(service.getById(normalUser, 999)).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.findById).toHaveBeenCalledWith(999);
    });
  });

  describe('listByUser()', () => {
    it('should return paginated jobs for a specific user', async () => {
      const dummyJobs = [
        { id: 11, triggeredById: 50 },
        { id: 12, triggeredById: 50 },
        { id: 13, triggeredById: 50 },
      ] as unknown as IngestionJob[];

      repo.findByUser.mockResolvedValueOnce([dummyJobs, 7]);

      const filter: GetIngestionJobsFilterDto = { page: 1, limit: 3 };
      const result = await service.listByUser(50, filter);

      expect(repo.findByUser).toHaveBeenCalledWith(50, { offset: 0, limit: 3 });
      expect(result.jobs).toBe(dummyJobs);
      expect(result.pagination).toEqual({
        totalItems:   7,
        itemCount:    3,
        itemsPerPage: 3,
        totalPages:   3,
        currentPage:  1,
      });
    });
  });
});
