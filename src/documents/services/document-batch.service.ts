import { Injectable } from '@nestjs/common';
import { CreationAttributes } from 'sequelize';
import { Document } from '../models/document.model';
import { DocumentRepository } from '../repository/documents.repository';

@Injectable()
export class DocumentBatchService {
  constructor(private readonly documentRepo: DocumentRepository) {}

  async bulkCreate(docs: CreationAttributes<Document>[]) {
    await this.documentRepo.createMany(docs);
    return { message: 'Bulk documents uploaded successfully' };
  }
}
