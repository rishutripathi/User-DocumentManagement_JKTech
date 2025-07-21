import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentQueryService } from './document-query.service';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { PermissionService } from './permission.service';
import { GetDocumentsFilterDto } from '../DTO/documents.dto';
import { Document } from '../models/document.model';
import { User } from 'src/user/models/user.model';

describe('DocumentQueryService', () => {
  let service: DocumentQueryService;
  let repo: jest.Mocked<IDocumentRepository>;
  let permissionService: jest.Mocked<PermissionService>;

  beforeEach(async () => {

    const repoMock = {
      find: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
    };
    const permissionMock = {
      canView: jest.fn(),
      canEdit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentQueryService,
        { provide: 'IDocumentRepository', useValue: repoMock },
        { provide: PermissionService, useValue: permissionMock },
      ],
    }).compile();

    service = module.get(DocumentQueryService);
    repo = module.get('IDocumentRepository') as jest.Mocked<IDocumentRepository>;
    permissionService = module.get(PermissionService) as jest.Mocked<PermissionService>;
  });

  describe('getAll()', () => {
    it('should return all documents in descending order', async () => {
      const docs = [{ id: 1 }, { id: 2 }] as Document[];
      repo.find.mockResolvedValue(docs);

      const result = await service.getAll();
      expect(repo.find).toHaveBeenCalledWith({ order: [['created_at', 'DESC']] });
      expect(result).toBe(docs);
    });
  });

  describe('getAllPaginated()', () => {
    it('returns defaults when no filters provided', async () => {
      repo.count.mockResolvedValue(0);
      repo.find.mockResolvedValue([]);

      const res = await service.getAllPaginated({} as GetDocumentsFilterDto);
      expect(repo.count).toHaveBeenCalledWith();
      expect(repo.find).toHaveBeenCalledWith({
        offset: 0,
        limit: 10,
        order: [['created_at', 'DESC']],
      });
      expect(res).toEqual({
        documents: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });
    });

    it('applies custom page and limit correctly', async () => {
      repo.count.mockResolvedValue(12);
      const docs = [{ id: 10 }, { id: 11 }] as Document[];
      repo.find.mockResolvedValue(docs);

      const res = await service.getAllPaginated({ page: 2, limit: 5 });
      expect(repo.count).toHaveBeenCalledWith();
      expect(repo.find).toHaveBeenCalledWith({
        offset: 5,
        limit: 5,
        order: [['created_at', 'DESC']],
      });
      expect(res).toEqual({
        documents: docs,
        pagination: { page: 2, limit: 5, total: 12, pages: 3 },
      });
    });
  });

  describe('getById()', () => {
    const user = { id: 99, username: 'alice' } as User;
    const plain = { id: 7, title: 'X' };

    it('throws NotFoundException if doc missing', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.getById(user, 7)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException if cannot view', async () => {
      const fakeDoc = ({ get: () => plain } as unknown) as Document;
      repo.findById.mockResolvedValue(fakeDoc);
      permissionService.canView.mockResolvedValue(false);

      await expect(service.getById(user, 7)).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns document + uploader info when allowed', async () => {
      const fakeDoc = ({ get: () => plain } as unknown) as Document;
      repo.findById.mockResolvedValue(fakeDoc);
      permissionService.canView.mockResolvedValue(true);

      const res = await service.getById(user, 7);
      expect(repo.findById).toHaveBeenCalledWith(7);
      expect(permissionService.canView).toHaveBeenCalledWith(user, 7);
      expect(res).toEqual({
        ...plain,
        uploadedBy: { id: user.id, username: user.username },
      });
    });
  });

  describe('getUserDocuments()', () => {
    const userId = 5;

    it('returns defaults for a user with no docs', async () => {
      repo.count.mockResolvedValue(0);
      repo.find.mockResolvedValue([]);

      const res = await service.getUserDocuments(userId, {
          page: 0,
          limit: 0
      });
      expect(repo.count).toHaveBeenCalledWith({ uploadedById: userId });
      expect(repo.find).toHaveBeenCalledWith({
        where: { uploadedById: userId },
        offset: 0,
        limit: 10,
        order: [['created_at', 'DESC']],
      });
      expect(res).toEqual({
        documents: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });
    });

    it('paginates correctly for a user with many docs', async () => {
      repo.count.mockResolvedValue(9);
      const docs = [{ id: 21 }, { id: 22 }] as Document[];
      repo.find.mockResolvedValue(docs);

      const res = await service.getUserDocuments(userId, { page: 3, limit: 2 });
      expect(repo.count).toHaveBeenCalledWith({ uploadedById: userId });
      expect(repo.find).toHaveBeenCalledWith({
        where: { uploadedById: userId },
        offset: 4,
        limit: 2,
        order: [['created_at', 'DESC']],
      });
      expect(res).toEqual({
        documents: docs,
        pagination: { page: 3, limit: 2, total: 9, pages: 5 },
      });
    });
  });
});
