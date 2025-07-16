import { Injectable, Logger } from "@nestjs/common";
import { IDocumentsService, IIngestionService, IUserService } from "../interfaces/seeding.interface";


@Injectable()
export class ResetSeedingService {
  private readonly logger = new Logger(ResetSeedingService.name);

  constructor(
    private readonly userService: IUserService,
    private readonly documentService: IDocumentsService,
    private readonly ingestionService: IIngestionService,
  ) {}

  async resetAllData() {
    this.logger.log('Starting database reset...');
    await this.ingestionService.deleteAllIngestionJobs();
    await this.documentService.deleteAllDocuments();
    await this.userService.deleteAllUsers();
    this.logger.log('All data reset successfully');
    return { message: 'All data reset successfully' };
  }
}
