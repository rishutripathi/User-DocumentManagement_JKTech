import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from './permission.service';
import { IDocumentRepository } from '../interfaces/document-repository.interface';
import { User } from 'src/user/models/user.model';

describe('PermissionService', () => {
  let service: PermissionService;
  let repo: jest.Mocked<Pick<IDocumentRepository, 'findById'>>;

  beforeEach(async () => {
    const repoMock: jest.Mocked<Pick<IDocumentRepository, 'findById'>> = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        { provide: 'IDocumentRepository', useValue: repoMock },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
    repo = module.get('IDocumentRepository');
  });

  describe('canView', () => {
    it('returns true immediately for admin users', async () => {
      const admin = { id: 1, role: 'admin' } as User;
      const result = await service.canView(admin, 123);
      expect(result).toBe(true);
      expect(repo.findById).not.toHaveBeenCalled();
    });

    it('returns true if the user uploaded the document', async () => {
      const user = { id: 2, role: 'user' } as unknown as User;
      repo.findById.mockResolvedValue({ id: 123, uploadedById: 2 } as any);
      const result = await service.canView(user, 123);
      expect(repo.findById).toHaveBeenCalledWith(123);
      expect(result).toBe(true);
    });

    it('returns false if the user did not upload the document', async () => {
      const user = { id: 3, role: 'user' } as unknown as User;
      repo.findById.mockResolvedValue({ id: 123, uploadedById: 99 } as any);
      const result = await service.canView(user, 123);
      expect(result).toBe(false);
    });

    it('returns false if the document does not exist', async () => {
      const user = { id: 4, role: 'user' } as unknown as User;
      repo.findById.mockResolvedValue(null);
      const result = await service.canView(user, 123);
      expect(result).toBe(false);
    });
  });

  describe('canEdit', () => {
    it('delegates to canView and returns its result', async () => {
      const spy = jest.spyOn(service, 'canView').mockResolvedValue(true);
      const user = { id: 5, role: 'user' } as unknown as User;
      const result = await service.canEdit(user, 456);
      expect(spy).toHaveBeenCalledWith(user, 456);
      expect(result).toBe(true);
    });

    it('propagates false from canView', async () => {
      jest.spyOn(service, 'canView').mockResolvedValue(false);
      const user = { id: 6, role: 'user' } as unknown as User;
      const result = await service.canEdit(user, 789);
      expect(result).toBe(false);
    });
  });
});
