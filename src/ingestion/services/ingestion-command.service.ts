import { Injectable } from "@nestjs/common";
import { User } from "src/user/models/user.model";
import { CreateIngestionJobDto, UpdateIngestionJobDto } from "../DTO/ingestion.dto";
import { IngestionStatus } from "src/common/enums/database.enums";
import { IngestionRepository } from "../repository/ingestion.repository";
import { IngestionStateMachineService } from "./ingestion-state-machine.service";
import { DocumentQueryService } from "src/documents/services/document-query.service";

@Injectable()
export class IngestionCommandService {
  constructor(
    private readonly ingestionRepo: IngestionRepository,
    private readonly documentsService: DocumentQueryService,
    private readonly stateMachine: IngestionStateMachineService,
  ) {}

  async trigger(user: User, dto: CreateIngestionJobDto) {
    await this.documentsService.getById(user, dto.documentId);
    const job = await this.ingestionRepo.create({
      documentId: dto.documentId,
      status: IngestionStatus.QUEUED,
      progress: 0,
      triggeredById: user.id,
      priority: dto.priority ?? 0,
      retryCount: 0,
      maxRetries: 3,
    } as any);
    return job;
  }
  
  async triggerBulk(user: any, dto: CreateIngestionJobDto[]) {

    for(let doc = 0; doc < dto.length; doc++) {
      await this.documentsService.getById(user, dto[doc].documentId);
      const job = await this.ingestionRepo.create({
        documentId: dto[doc].documentId,
        status: IngestionStatus.QUEUED,
        progress: 0,
        triggeredById: user?.id,
        priority: dto[doc].priority ?? 0,
        retryCount: 0,
        maxRetries: 3,
      } as any);
    }
    return {
      message: "Docuemnts ingested successfully"
    };
  }

  async updateStatus(id: number, dto: UpdateIngestionJobDto) {
    const changes = this.stateMachine.computeChanges(dto);
    await this.ingestionRepo.update({ id }, changes);
  }

  async cancel(user: User, id: number) {
    const job = this.stateMachine.ensureCanCancel(await this.ingestionRepo.findById(id), user);
    await this.ingestionRepo.update({ id }, job.toCancelUpdate());
  }

  async retry(user: User, id: number) {
    const job = this.stateMachine.ensureCanRetry(await this.ingestionRepo.findById(id), user);
    await this.ingestionRepo.update({ id }, job.toRetryUpdate());
  }

  async delete(id: number) {
    await this.ingestionRepo.deleteById(id);
  }

  async deleteAll() {
    await this.ingestionRepo.deleteAll();
  }
}