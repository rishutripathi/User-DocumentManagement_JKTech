import { BadRequestException, Injectable } from "@nestjs/common";
import { IngestionCommandService } from "./ingestion-command.service";
import { WebhookDto } from "../DTO/ingestion-webhook.dto";

@Injectable()
export class IngestionWebhookService {
  constructor(private readonly commands: IngestionCommandService) {}

  async handle(payload: WebhookDto) {
    if (!payload.jobId) throw new BadRequestException('jobId required');
    return this.commands.updateStatus(payload.jobId, {
        status: payload.status,
        progress: payload.progress,
        errorMessage: undefined,
        resultData: undefined
    });
  }
}
