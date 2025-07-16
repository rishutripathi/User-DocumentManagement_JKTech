import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User } from 'src/user/models/user.model';
import { GetIngestionJobsFilterDto } from '../DTO/ingestion.dto';
import { IngestionJob } from '../models/ingestion_jobs.model';
import { IngestionRepository } from '../repository/ingestion.repository';
import { PaginatedResult } from '../interfaces/ingestion-repositories';


@Injectable()
export class IngestionQueryService {
  constructor(
    private readonly ingestionRepo: IngestionRepository,
  ) {}

  async list(user: User, filter: GetIngestionJobsFilterDto): Promise<PaginatedResult<IngestionJob>> {
    const { page, limit } = filter;
    const offset = (page - 1) * limit;

    const { rows: jobs, count: totalItems } = await this.ingestionRepo.findAndCountAll({ offset, limit });

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
    const job = await this.ingestionRepo.findById(id);
    if (!job) throw new NotFoundException('Job not found');
    if (user.role !== 'admin' && job.triggeredById !== user.id) {
      throw new ForbiddenException();
    }
    return job;
  }

  async listByUser(userId: number, filter: GetIngestionJobsFilterDto): Promise<PaginatedResult<IngestionJob>> {
    const { page, limit } = filter;
    const offset = (page - 1) * limit;

    const jobs: IngestionJob[] = await this.ingestionRepo.find({where: { triggeredById: userId }});
    const totalItems = jobs.length;
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
