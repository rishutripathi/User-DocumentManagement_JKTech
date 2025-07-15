// ingestion/services/ingestion-query.service.ts
import { Injectable, NotFoundException, ForbiddenException, Inject } from '@nestjs/common';
import { User } from 'src/user/models/user.model';
import { GetIngestionJobsFilterDto } from '../DTO/ingestion.dto';
import { IIngestionReadRepo } from '../interfaces/ingestion-repositories';
import { IngestionJob } from '../models/ingestion_jobs.model';

export interface PaginatedResult<T> {
  jobs: T[];
  pagination: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}

@Injectable()
export class IngestionQueryService {
  constructor(
    @Inject('IngestionReadRepo') private readonly repo: IIngestionReadRepo,
  ) {}

  async list(user: User, filter: GetIngestionJobsFilterDto): Promise<PaginatedResult<IngestionJob>> {
    const { page, limit } = filter;
    const offset = (page - 1) * limit;

    // repo.findAllWithCount needs to return [jobs, totalCount]
    const [jobs, totalItems] = await this.repo.findAllWithCount({ offset, limit });

    const totalPages = Math.ceil(totalItems / limit);
    return {
      jobs,
      pagination: {
        totalItems,
        itemCount: jobs.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async getById(user: User, id: number) {
    const job = await this.repo.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    if (user.role !== 'admin' && job.triggeredById !== user.id) {
      throw new ForbiddenException();
    }
    return job;
  }

  async listByUser(userId: number, filter: GetIngestionJobsFilterDto): Promise<PaginatedResult<IngestionJob>> {
    const { page, limit } = filter;
    const offset = (page - 1) * limit;

    // same idea: findByUser already returned [jobs, total]
    const [jobs, totalItems] = await this.repo.findByUser(userId, { offset, limit });

    const totalPages = Math.ceil(totalItems / limit);
    return {
      jobs,
      pagination: {
        totalItems,
        itemCount: jobs.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }
}
