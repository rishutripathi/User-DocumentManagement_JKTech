import { Injectable, Logger } from "@nestjs/common";
import { IDocumentsService, IIngestionService, ISeedingService, IUserService } from "../interfaces/seeding.interface";
import { Status } from "src/common/type/status.type";
import { faker } from "@faker-js/faker/.";

@Injectable()
export class IngestionSeedingService implements ISeedingService {
  private readonly logger = new Logger(IngestionSeedingService.name);

  constructor(
    private readonly ingestionService: IIngestionService,
    private readonly documentService: IDocumentsService,
    private readonly userService: IUserService
  ) {}

  async seed(count: number = 10000) {
    this.logger.log(`Starting to seed ${count} ingestion jobs...`);
    const allDocuments = await this.documentService.getAllDocuments();
    const allUsers = await this.userService.getAllUsers();
    if (!allDocuments.length || !allUsers.length) throw new Error('Seed documents and users first.');

    const startTime = Date.now();
    const batchSize = 500;
    const statuses: (Status | 'queued' | 'cancelled')[] = ['pending', 'processing', 'completed', 'failed', 'queued', 'cancelled'];
    const statusWeights = [0.1, 0.05, 0.7, 0.1, 0.05];

    let totalCreated = 0;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - totalCreated);
      const jobsToCreate: any[] = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const document = allDocuments[Math.floor(Math.random() * allDocuments.length)];
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        const random = Math.random();
        let status: Status | 'queued' | 'cancelled' = 'completed';
        let cumulativeWeight = 0;
        for (let j = 0; j < statusWeights.length; j++) {
          cumulativeWeight += statusWeights[j];
          if (random < cumulativeWeight) {
            status = statuses[j];
            break;
          }
        }

        const createdAt = faker.date.recent({ days: 90 });
        const startedAt = ['processing', 'completed', 'failed', 'cancelled'].includes(status)
          ? faker.date.between({ from: createdAt, to: new Date() })
          : null;
        const completedAt = ['completed', 'failed', 'cancelled'].includes(status) && startedAt
          ? faker.date.between({ from: startedAt, to: new Date() })
          : null;

        jobsToCreate.push({
          status,
          progress: status === 'completed' ? '100.00' : status === 'processing' ? (Math.random() * 80 + 10).toFixed(2) : '0.00',
          startedAt,
          completedAt,
          triggeredById: user.id,
          createdAt,
          updatedAt: completedAt || startedAt || createdAt,
        });
      }

      await this.ingestionService.createBulkIngestionJobs(jobsToCreate);
      totalCreated += currentBatchSize;
      this.logger.log(`Batch ${batch + 1}/${batches} completed. Created ${totalCreated}/${count} jobs`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`Successfully seeded ${totalCreated} jobs in ${duration} seconds`);
    return { message: `Successfully seeded ${totalCreated} ingestion jobs`, duration, total: totalCreated };
  }
}