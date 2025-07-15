import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { IngestionJob } from "../models/ingestion_jobs.model";
import { UpdateUserDto } from "src/user/DTO/user.dtos";
import { IngestionStatus } from "../enum/ingestion.enum";
import { User } from "src/user/models/user.model";

@Injectable()
export class IngestionStateMachineService {
  computeChanges(dto: UpdateUserDto): Partial<IngestionJob> {
    const now = new Date();
    const changes: any = { updatedAt: now };
    if (dto.status) {
      changes.status = dto.status;
      if (dto.status === IngestionStatus.PROCESSING) changes.startedAt = now;
    }
    if (dto.progress != null) changes.progress = dto.progress;
    if (dto.errorMessage) changes.errorMessage = dto.errorMessage;
    if (dto.resultData) changes.resultData = dto.resultData;
    return changes;
  }

  ensureCanCancel(job: IngestionJob, user: User): IngestionJob {
    if (!job) throw new NotFoundException();
    if (user.role !== 'admin' && job.triggeredById !== user.id) throw new ForbiddenException();
    if ([IngestionStatus.COMPLETED, IngestionStatus.FAILED, IngestionStatus.CANCELLED].includes(job.status)) {
      throw new BadRequestException('Cannot cancel in current status');
    }
    return job;
  }

  ensureCanRetry(job: IngestionJob, user: User): IngestionJob {
    if (!job) throw new NotFoundException();
    if (user.role !== 'admin' && job.triggeredById !== user.id) throw new ForbiddenException();
    if (job.status !== IngestionStatus.FAILED) {
      throw new BadRequestException('Only failed jobs can be retried');
    }
    if (job.retryCount >= job.maxRetries) {
      throw new BadRequestException('Max retries reached');
    }
    return job;
  }
}
