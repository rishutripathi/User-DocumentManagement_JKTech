import { Injectable } from '@nestjs/common';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { CreationAttributes } from 'sequelize';
import { Document } from '../models/document.model';

@Injectable()
export class DocumentBatchService {
  constructor(private readonly documentRepo: IDocumentRepository) {}

  async bulkCreate(docs: CreationAttributes<Document>[]) {
    await this.documentRepo.createMany(docs);
    return { message: 'Bulk documents uploaded successfully' };
  }
}
