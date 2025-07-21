import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentCommandService } from './document-command.service';
import { PermissionService } from './permission.service';
import { StorageService } from './storage.service';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { DocumentStatus } from 'src/common/enums/database.enums';
import { CreateDocumentDto, UpdateDocumentDto } from '../DTO/documents.dto';
import { User } from 'src/user/models/user.model';

describe('DocumentCommandService', () => {
  let service: DocumentCommandService;
  let repo: jest.Mocked<IDocumentRepository>;
  let permissionService: jest.Mocked<PermissionService>;
  let storageService: jest.Mocked<StorageService>;

  beforeEach(async () => {
    // create fresh mocks for each test
    const repoMock = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      deleteById: jest.fn(),
      deleteAll: jest.fn(),
    };
    const permissionMock = {
      canEdit: jest.fn(),
      canView: jest.fn(),
    } as Partial<PermissionService> as jest.Mocked<PermissionService>;
    const storageMock = {
      delete: jest.fn(),
    } as Partial<StorageService> as jest.Mocked<StorageService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentCommandService,
        { provide: 'IDocumentRepository', useValue: repoMock },
        { provide: PermissionService, useValue: permissionMock },
        { provide: StorageService, useValue: storageMock },
      ],
    }).compile();

    service = module.get(DocumentCommandService);
    repo = module.get('IDocumentRepository');
    permissionService = module.get(PermissionService);
    storageService = module.get(StorageService);
  });

  describe('create()', () => {
    it('merges file + DTO, calls repo.create, and returns the new document', async () => {
      const user = { id: 42 } as User;
      const file = {
        originalname: 'foo.pdf',
        path: '/tmp/foo.pdf',
        size: 1234,
        mimetype: 'application/pdf',
      } as Express.Multer.File;
      const dto: CreateDocumentDto = { title: 'T', description: 'D' };
      const fakeDoc = { id: 7, ...dto } as any;
      repo.create.mockResolvedValue(fakeDoc);

      const result = await service.create(user, file, dto);

      expect(repo.create).toHaveBeenCalledWith({
        title: 'T',
        description: 'D',
        fileName: 'foo.pdf',
        filePath: '/tmp/foo.pdf',
        fileSize: 1234,
        mimeType: 'application/pdf',
        tags: '',
        uploadedById: 42,
        status: DocumentStatus.PENDING,
      });
      expect(result).toEqual({
        message: 'Document uploaded successfully',
        document: fakeDoc,
      });
    });
  });

  describe('update()', () => {
    const user = { id: 1 } as User;
    const dto: UpdateDocumentDto = { title: 'New', tags: ['x', 'y'] };

    it('throws ForbiddenException when permission denied', async () => {
      permissionService.canEdit.mockResolvedValue(false);
      await expect(service.update(user, 99, dto))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when repo.update returns [0]', async () => {
      permissionService.canEdit.mockResolvedValue(true);
      repo.update.mockResolvedValue([1, []] as [number, any[]]);
      await expect(service.update(user, 5, dto))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns success when repo.update returns [n>0]', async () => {
      permissionService.canEdit.mockResolvedValue(true);
       repo.update.mockResolvedValue([2, []] as [number, any[]]);
      const res = await service.update(user, 5, dto);

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New',
          tags: 'x,y',
          updatedAt: expect.any(Date),
        }),
        { id: 5 },
      );
      expect(res).toEqual({ message: 'Document updated successfully' });
    });
  });

  describe('delete()', () => {
    const user = { id: 2 } as User;
    const doc = { id: 3, filePath: '/tmp/z.txt' } as any;

    it('throws ForbiddenException when canView is false', async () => {
      permissionService.canView.mockResolvedValue(false);
      await expect(service.delete(user, 3))
        .rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws NotFoundException when findById returns null', async () => {
      permissionService.canView.mockResolvedValue(true);
      repo.findById.mockResolvedValue(null);
      await expect(service.delete(user, 3))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletes file and record on success', async () => {
      permissionService.canView.mockResolvedValue(true);
      repo.findById.mockResolvedValue(doc);
      const resp = await service.delete(user, 3);

      expect(storageService.delete).toHaveBeenCalledWith('/tmp/z.txt');
      expect(repo.deleteById).toHaveBeenCalledWith(3);
      expect(resp).toEqual({ message: 'Document deleted successfully' });
    });
  });

  describe('deleteAll()', () => {
    it('calls repo.deleteAll and returns success message', async () => {
      repo.deleteAll.mockResolvedValue(undefined);
      await expect(service.deleteAll())
        .resolves.toEqual({ message: 'All documents deleted successfully' });
      expect(repo.deleteAll).toHaveBeenCalled();
    });
  });

  describe('updateStatus()', () => {
    it('throws NotFoundException when no rows updated', async () => {
      repo.update.mockResolvedValue([1, []] as [number, any[]]);
      await expect(
        service.updateStatus(10, DocumentStatus.COMPLETED),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('returns success when rows updated', async () => {
      repo.update.mockResolvedValue([1, []] as [number, any[]]);
      const out = await service.updateStatus(10, DocumentStatus.COMPLETED);

      expect(repo.update).toHaveBeenCalledWith(
        { status: DocumentStatus.COMPLETED },
        { id: 10 },
      );
      expect(out).toEqual({
        message: 'Document status updated successfully',
      });
    });
  });
});
