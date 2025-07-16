import { Inject, Injectable } from "@nestjs/common";
import { IIngestionWriteRepo } from "../interfaces/ingestion-repositories";
import { DocumentsService } from "src/documents/services/documents.service";
import { User } from "src/user/models/user.model";
import { CreateIngestionJobDto, TriggerIngestionDto } from "../DTO/ingestion.dto";
import { IngestionStatus } from "src/common/enums/database.enums";
import { UpdateUserDto } from "src/user/DTO/user.dtos";
import { IngestionStateMachineService } from "./ingestion-state-machine.service";


@Injectable()
export class IngestionCommandService {
  constructor(
    @Inject('IngestionWriteRepo') private readonly repo: IIngestionWriteRepo,
    private readonly docs: DocumentsService,
    private readonly stateMachine: IngestionStateMachineService,
  ) {}

  async trigger(user: User, dto: CreateIngestionJobDto) {
    await this.docs.getDocumentById(user, dto.documentId);
    const job = await this.repo.create({
      documentId: dto.documentId,
      status: IngestionStatus.QUEUED,
      progress: 0,
      triggeredById: user.id,
      priority: dto.priority ?? 0,
      retryCount: 0,
      maxRetries: 3,
    });
    return job;
  }

  async updateStatus(id: number, dto: UpdateUserDto) {
    const changes = this.stateMachine.computeChanges(dto);
    await this.repo.update(id, changes);
  }

  async cancel(user: User, id: number) {
    const job = await this.stateMachine.ensureCanCancel(await this.repo.findById(id), user);
    await this.repo.update(id, job.toCancelUpdate());
  }

  async retry(user: User, id: number) {
    const job = await this.stateMachine.ensureCanRetry(await this.repo.findById(id), user);
    await this.repo.update(id, job.toRetryUpdate());
  }

  async delete(id: number) {
    await this.repo.delete(id);
  }

  async deleteAll() {
    await this.repo.deleteAll();
  }
}
