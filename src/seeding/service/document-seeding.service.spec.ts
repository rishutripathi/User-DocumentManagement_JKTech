import { Test, TestingModule } from '@nestjs/testing';
import { DocumentSeedingService } from './document-seeding.service';
import { IDocumentsService, IUserService } from '../interfaces/seeding.interface';
import * as fs from 'fs';
import { faker } from '@faker-js/faker';
import { User } from 'src/user/models/user.model';


jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

jest.mock('path', () => ({
  join: jest.fn().mockReturnValue('/mocked/path/uploads'),
}));

describe('DocumentSeedingService', () => {
  let service: DocumentSeedingService;
  let documentService: jest.Mocked<IDocumentsService>;
  let userService: jest.Mocked<IUserService>;

  // Helper function to create a mock User object
  const createMockUser = (id: number): User => ({
    id,
    username: faker.internet.userName(),
    email: faker.internet.email(),
    password: faker.internet.password(),
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    role: 'VIEWER',
    isActive: true,
    lastLoginAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as User);

  beforeEach(async () => {
    // Mock implementations for dependencies
    documentService = {
      getAllDocuments: jest.fn(),
      uploadBulkDocuments: jest.fn(),
      createDocPermissions: jest.fn(),
      deleteAllDocuments: jest.fn(),
    } as jest.Mocked<IDocumentsService>;

    userService = {
      getAllUsers: jest.fn(),
      deleteAllUsers: jest.fn(),
      bulkCreate: jest.fn(),
    } as jest.Mocked<IUserService>;

    // Mock fs methods
    mockedFs.existsSync.mockReturnValue(false);
    mockedFs.mkdirSync.mockImplementation(() => undefined);
    mockedFs.writeFileSync.mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentSeedingService,
        { provide: 'IDocumentsService', useValue: documentService },
        { provide: 'IUserService', useValue: userService },
      ],
    }).compile();

    service = module.get<DocumentSeedingService>(DocumentSeedingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seed', () => {
    it('should throw an error if no users are found', async () => {
      userService.getAllUsers.mockResolvedValue([]);
      await expect(service.seed(10)).rejects.toThrow('No users found. Seed users first.');
    });

    it('should create uploads directory if it does not exist', async () => {
      userService.getAllUsers.mockResolvedValue([createMockUser(1)]);
      documentService.uploadBulkDocuments.mockResolvedValue(undefined);
      await service.seed(10);
      expect(mockedFs.existsSync).toHaveBeenCalledWith('/mocked/path/uploads');
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/mocked/path/uploads', { recursive: true });
    });

    it('should seed documents in batches and call uploadBulkDocuments', async () => {
      userService.getAllUsers.mockResolvedValue([createMockUser(1), createMockUser(2)]);
      documentService.uploadBulkDocuments.mockResolvedValue(undefined);

      await service.seed(600); // Should create 2 batches: 500 + 100

      expect(documentService.uploadBulkDocuments).toHaveBeenCalledTimes(2);
      expect(documentService.uploadBulkDocuments).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            fileName: expect.any(String),
            filePath: expect.any(String),
            fileSize: expect.any(Number),
            mimeType: expect.any(String),
            status: expect.any(String),
            uploadedById: expect.any(Number),
            tags: expect.any(String),
          }),
        ]),
      );
      expect(documentService.uploadBulkDocuments).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            title: expect.any(String),
            fileName: expect.any(String),
            filePath: expect.any(String),
            fileSize: expect.any(Number),
            mimeType: expect.any(String),
            status: expect.any(String),
            uploadedById: expect.any(Number),
            tags: expect.any(String),
          }),
        ]),
      );
    });

    it('should generate documents with correct properties', async () => {
      userService.getAllUsers.mockResolvedValue([createMockUser(1), createMockUser(2)]);
      documentService.uploadBulkDocuments.mockResolvedValue(undefined);

      // Spy on writeFileSync to capture file content
      const writeFileSyncSpy = jest.spyOn(mockedFs, 'writeFileSync');
      await service.seed(1);

      const documents = documentService.uploadBulkDocuments.mock.calls[0][0];
      expect(documents).toHaveLength(1);
      const doc = documents[0];

      expect(doc).toEqual({
        title: expect.any(String),
        description: expect.any(String),
        fileName: expect.stringMatching(/\.\w+$/), // Matches filename with extension
        filePath: expect.stringContaining('seed_'),
        fileSize: expect.any(Number),
        mimeType: expect.stringMatching(
          /application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|text\/plain/,
        ),
        status: expect.stringMatching(/PENDING|PROCESSING|COMPLETED|FAILED/),
        uploadedById: expect.any(Number),
        tags: expect.any(String),
      });

      expect(JSON.parse(doc.tags)).toBeInstanceOf(Array);
      expect(writeFileSyncSpy).toHaveBeenCalledWith(doc.filePath, expect.any(String));
    });

    it('should return correct seeding result', async () => {
      userService.getAllUsers.mockResolvedValue([createMockUser(1)]);
      documentService.uploadBulkDocuments.mockResolvedValue(undefined);

      const result = await service.seed(10);
      expect(result).toEqual({
        message: 'Successfully seeded 10 documents',
        duration: expect.any(String),
        total: 10,
      });
    });

    it('should handle errors from uploadBulkDocuments', async () => {
      userService.getAllUsers.mockResolvedValue([createMockUser(1)]);
      documentService.uploadBulkDocuments.mockRejectedValue(new Error('Database error'));

      await expect(service.seed(10)).rejects.toThrow('Database error');
      expect(documentService.uploadBulkDocuments).toHaveBeenCalled();
    });
  });
});