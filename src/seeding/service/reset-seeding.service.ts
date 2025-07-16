import { Injectable, Logger } from "@nestjs/common";
import { IDocumentsService, IIngestionService } from "../interfaces/seeding.interface";
import { UserDeleteService } from "src/user/service/user-delete.service";
import { DocumentCommandService } from "src/documents/services/document-command.service";
import { IngestionCommandService } from "src/ingestion/services/ingestion-command.service";


@Injectable()
export class ResetSeedingService {
  private readonly logger = new Logger(ResetSeedingService.name);

  constructor(
    private readonly userService: UserDeleteService,
    private readonly documentService: DocumentCommandService,
    private readonly ingestionService: IngestionCommandService,
  ) {}

  async resetAllData() {
    this.logger.log('Starting database reset...');
    await this.ingestionService.deleteAll();
    await this.documentService.deleteAll();
    await this.userService.deleteAllUsers();
    this.logger.log('All data reset successfully');
    return { message: 'All data reset successfully' };
  }
}
