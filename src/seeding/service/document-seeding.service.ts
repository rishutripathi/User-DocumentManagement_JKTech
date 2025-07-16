import { Injectable, Logger } from "@nestjs/common";
import { IDocumentsService, ISeedingService, IUserService } from "../interfaces/seeding.interface";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { faker } from "@faker-js/faker/.";
import { join } from "path";
import { DocumentStatus } from "src/common/enums/database.enums";


@Injectable()
export class DocumentSeedingService implements ISeedingService {
  private readonly logger = new Logger(DocumentSeedingService.name);

  constructor(
    private readonly documentService: IDocumentsService,
    private readonly userService: IUserService,
  ) {}

  async seed(count: number = 100000) {
    this.logger.log(`Starting to seed ${count} documents...`);
    const allUsers = await this.userService.getAllUsers();
    if (!allUsers.length) throw new Error('No users found. Seed users first.');

    const uploadsDir = join(process.cwd(), 'uploads');
    if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

    const startTime = Date.now();
    const batchSize = 500;
    const fileTypes = [
      { ext: 'pdf', mime: 'application/pdf' },
      { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { ext: 'txt', mime: 'text/plain' },
    ];
    const statusWeights = [0.2, 0.1, 0.6, 0.1]; // pending, processing, completed, failed

    let totalCreated = 0;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - totalCreated);
      const documentsToCreate: any[] = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const fileName = `${faker.system.fileName({ extensionCount: 0 })}.${fileType.ext}`;
        const filePath = join(uploadsDir, `seed_${Date.now()}_${i}_${fileName}`);
        const fileContent = faker.lorem.paragraphs(3);
        writeFileSync(filePath, fileContent);

        const owner = allUsers[Math.floor(Math.random() * allUsers.length)];
        const random = Math.random();
        let status: DocumentStatus = DocumentStatus.COMPLETED;
        if (random < statusWeights[0]) status = DocumentStatus.PENDING;
        else if (random < statusWeights[0] + statusWeights[1]) status = DocumentStatus.PROCESSING;
        else if (random < statusWeights[0] + statusWeights[1] + statusWeights[2]) status = DocumentStatus.COMPLETED;

        documentsToCreate.push({
          title: faker.lorem.sentence({ min: 2, max: 6 }),
          description: Math.random() > 0.3 ? faker.lorem.paragraph() : '',
          fileName,
          filePath,
          fileSize: Buffer.byteLength(fileContent),
          mimeType: fileType.mime,
          status,
          uploadedById: owner.id,
          tags: JSON.stringify(Array.from({ length: Math.floor(Math.random() * 5) }, () => faker.lorem.word())),
        });
      }

      await this.documentService.uploadBulkDocuments(documentsToCreate);
      totalCreated += currentBatchSize;
      this.logger.log(`Batch ${batch + 1}/${batches} completed. Created ${totalCreated}/${count} documents`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`Successfully seeded ${totalCreated} documents in ${duration} seconds`);
    return { message: `Successfully seeded ${totalCreated} documents`, duration, total: totalCreated };
  }
}
