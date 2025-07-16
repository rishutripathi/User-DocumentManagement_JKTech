import { Injectable, Logger } from "@nestjs/common";
import { UserSeedingService } from "./user-seeding.service";
import { DocumentSeedingService } from "./document-seeding.service";
import { IngestionSeedingService } from "./ingestion-seeding.service";
import { ISeedingResult } from "../interfaces/seeding.interface";

@Injectable()
export class CoordinatorSeedingService {
  private readonly logger = new Logger(CoordinatorSeedingService.name);

  constructor(
    private readonly userSeedingService: UserSeedingService,
    private readonly documentSeedingService: DocumentSeedingService,
    private readonly ingestionSeedingService: IngestionSeedingService,
  ) {}

  async seedAll(options: { userCount: number; documentCount: number }) {
    this.logger.log('Starting complete database seeding...');
    const startTime = Date.now();
    const results: ISeedingResult[] = [];

    results.push(await this.userSeedingService.seed(options.userCount));
    results.push(await this.documentSeedingService.seed(options.documentCount));
    results.push(await this.ingestionSeedingService.seed(0, Math.floor(options.documentCount * 0.1)));

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`Complete seeding finished in ${totalDuration} seconds`);
    return { message: 'All data seeded successfully', totalDuration, results };
  }
}