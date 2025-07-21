import { DocumentBatchService } from './document-batch.service';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { CreationAttributes } from 'sequelize';
import { Document } from '../models/document.model';

describe('DocumentBatchService', () => {
  let service: DocumentBatchService;
  let mockRepo: jest.Mocked<IDocumentRepository>;

  beforeEach(() => {
    mockRepo = {
      createMany: jest.fn(),
    } as unknown as jest.Mocked<IDocumentRepository>;

    service = new DocumentBatchService(mockRepo);
  });

  it('calls createMany and returns a success message', async () => {
    const docs: CreationAttributes<Document>[] = [
      { title: 'A' } as any,
      { title: 'B' } as any,
    ];
    mockRepo.createMany.mockResolvedValue(undefined);

    const result = await service.bulkCreate(docs);

    expect(mockRepo.createMany).toHaveBeenCalledWith(docs);
    expect(result).toEqual({ message: 'Bulk documents uploaded successfully' });
  });

  it('bubbles up repository errors', async () => {
    const docs: CreationAttributes<Document>[] = [];
    mockRepo.createMany.mockRejectedValue(new Error('boom'));

    await expect(service.bulkCreate(docs)).rejects.toThrow('boom');
    expect(mockRepo.createMany).toHaveBeenCalledWith(docs);
  });
});
