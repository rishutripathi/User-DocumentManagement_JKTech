import { Test, TestingModule } from '@nestjs/testing';
import { IngestionCommandService } from './ingestion-command.service';
import { DocumentsService } from 'src/documents/services/documents.service';
import { IngestionStateMachineService } from './ingestion-state-machine.service';
import { IngestionStatus } from 'src/common/enums/database.enums';

describe('IngestionCommandService', () => {
  let service: IngestionCommandService;

  let repo: {
    create: jest.Mock<any, any>;
    update: jest.Mock<any, any>;
    findById: jest.Mock<any, any>;
    delete: jest.Mock<any, any>;
    deleteAll: jest.Mock<any, any>;
  };
  let docs: { getDocumentById: jest.Mock<any, any> };
  let sm: {
    computeChanges: jest.Mock<any, any>;
    ensureCanCancel: jest.Mock<any, any>;
    ensureCanRetry: jest.Mock<any, any>;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
    };
    docs = { getDocumentById: jest.fn() };
    sm = {
      computeChanges: jest.fn(),
      ensureCanCancel: jest.fn(),
      ensureCanRetry: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionCommandService,
        { provide: 'IngestionWriteRepo', useValue: repo },
        { provide: DocumentsService, useValue: docs },
        { provide: IngestionStateMachineService, useValue: sm },
      ],
    }).compile();

    service = module.get(IngestionCommandService);
  });

  describe('trigger()', () => {
    it('fetches the document, enqueues a job, and returns it', async () => {
      const user = { id: 1 } as any;
      const dto = { documentId: 10, priority: 2 } as any; 
      const fakeJob = { id: 100 };

      docs.getDocumentById.mockResolvedValue(undefined);
      repo.create.mockResolvedValue(fakeJob);

      const result = await service.trigger(user, dto);

      expect(docs.getDocumentById).toHaveBeenCalledWith(user, 10);
      expect(repo.create).toHaveBeenCalledWith({
        documentId:    10,
        status:        IngestionStatus.QUEUED,
        progress:      0,
        triggeredById: 1,
        priority:      2,
        retryCount:    0,
        maxRetries:    3,
      });
      expect(result).toBe(fakeJob);
    });
  });

  describe('updateStatus()', () => {
    it('computes changes then calls repo.update()', async () => {
      const id = 5;
      const dto = { status: 'completed' } as any;
      const changes = { status: IngestionStatus.COMPLETED };

      sm.computeChanges.mockReturnValue(changes);
      await service.updateStatus(id, dto);

      expect(sm.computeChanges).toHaveBeenCalledWith(dto);
      expect(repo.update).toHaveBeenCalledWith(id, changes);
    });
  });

  describe('cancel()', () => {
    it('loads the job, ensures cancel, then updates', async () => {
      const user = { id: 2 } as any;
      const jobId = 20;
      const existing = { id: jobId, status: IngestionStatus.PROCESSING };
      const wrapper = { toCancelUpdate: () => ({ status: IngestionStatus.CANCELLED }) };

      repo.findById.mockResolvedValue(existing);
      sm.ensureCanCancel.mockResolvedValue(wrapper);

      await service.cancel(user, jobId);

      expect(repo.findById).toHaveBeenCalledWith(jobId);
      expect(sm.ensureCanCancel).toHaveBeenCalledWith(existing, user);
      expect(repo.update).toHaveBeenCalledWith(jobId, { status: IngestionStatus.CANCELLED });
    });
  });

  describe('retry()', () => {
    it('loads the job, ensures retry, then updates', async () => {
      const user = { id: 3 } as any;
      const jobId = 30;
      const existing = { id: jobId, retryCount: 1 };
      const wrapper = { toRetryUpdate: () => ({ retryCount: 2, status: IngestionStatus.QUEUED }) };

      repo.findById.mockResolvedValue(existing);
      sm.ensureCanRetry.mockResolvedValue(wrapper);

      await service.retry(user, jobId);

      expect(repo.findById).toHaveBeenCalledWith(jobId);
      expect(sm.ensureCanRetry).toHaveBeenCalledWith(existing, user);
      expect(repo.update).toHaveBeenCalledWith(jobId, {
        retryCount: 2,
        status:     IngestionStatus.QUEUED,
      });
    });
  });

  describe('delete()', () => {
    it('calls repo.delete()', async () => {
      const jobId = 40;
      await service.delete(jobId);
      expect(repo.delete).toHaveBeenCalledWith(jobId);
    });
  });

  describe('deleteAll()', () => {
    it('calls repo.deleteAll()', async () => {
      await service.deleteAll();
      expect(repo.deleteAll).toHaveBeenCalled();
    });
  });
});
