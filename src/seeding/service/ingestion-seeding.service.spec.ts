import { Test, TestingModule } from '@nestjs/testing';
import { IngestionSeedingService } from './ingestion-seeding.service';
import { Logger } from '@nestjs/common';
import { faker } from '@faker-js/faker';


const mockUserService = {
  getAllUsers: jest.fn(),
};

const mockDocumentService = {
  getAllDocuments: jest.fn(),
};

const mockIngestionService = {
  createBulkIngestionJobs: jest.fn(),
};

// Mock Logger
jest.spyOn(Logger.prototype, 'log').mockImplementation(jest.fn());
jest.spyOn(Logger.prototype, 'error').mockImplementation(jest.fn());

// Mock faker
jest.mock('@faker-js/faker', () => ({
  faker: {
    date: {
      recent: jest.fn(),
      between: jest.fn(),
    },
    lorem: {
      sentence: jest.fn(),
      paragraphs: jest.fn(),
      word: jest.fn(),
    },
    helpers: {
      arrayElement: jest.fn(),
    },
  },
}));

describe('IngestionSeedingService', () => {
  let service: IngestionSeedingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionSeedingService,
        { provide: 'IUserService', useValue: mockUserService },
        { provide: 'IDocumentsService', useValue: mockDocumentService },
        { provide: 'IIngestionService', useValue: mockIngestionService },
      ],
    }).compile();

    service = module.get<IngestionSeedingService>(IngestionSeedingService);

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('seed', () => {
    const mockUsers = [{ id: 1 }, { id: 2 }];
    const mockDocuments = [{ id: 101 }, { id: 102 }];
    const mockCreatedAt = new Date('2025-07-01');
    const mockStartedAt = new Date('2025-07-02');
    const mockCompletedAt = new Date('2025-07-03');

    beforeEach(() => {
      // Mock faker methods
      (faker.date.recent as jest.Mock).mockReturnValue(mockCreatedAt);
      (faker.date.between as jest.Mock).mockReturnValueOnce(mockStartedAt).mockReturnValueOnce(mockCompletedAt);
      (faker.lorem.sentence as jest.Mock).mockReturnValue('Error message');
      (faker.lorem.paragraphs as jest.Mock).mockReturnValue('Sample text');
      (faker.lorem.word as jest.Mock).mockReturnValue('entity');
      (faker.helpers.arrayElement as jest.Mock).mockReturnValue('PERSON');
    });

    it('should throw an error if no users are found', async () => {
      mockUserService.getAllUsers.mockResolvedValue([]);
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);

      await expect(service.seed(10)).rejects.toThrow('Seed documents and users first.');
      expect(mockUserService.getAllUsers).toHaveBeenCalled();
      expect(mockDocumentService.getAllDocuments).toHaveBeenCalled();
    });

    it('should throw an error if no documents are found', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);
      mockDocumentService.getAllDocuments.mockResolvedValue([]);

      await expect(service.seed(10)).rejects.toThrow('Seed documents and users first.');
      expect(mockUserService.getAllUsers).toHaveBeenCalled();
      expect(mockDocumentService.getAllDocuments).toHaveBeenCalled();
    });

    it('should seed ingestion jobs in batches and return result', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      mockIngestionService.createBulkIngestionJobs.mockResolvedValue(undefined);

      // Mock Math.random to control status selection (choose 'completed')
      jest.spyOn(global.Math, 'random').mockReturnValue(0.75); // Falls in 'completed' range (0.15-0.85)

      const result = await service.seed(600); // 2 batches: 500 + 100

      // Verify batch processing
      expect(mockIngestionService.createBulkIngestionJobs).toHaveBeenCalledTimes(2);
      expect(mockIngestionService.createBulkIngestionJobs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'completed',
            progress: '100.00',
            documentId: expect.any(Number),
            triggeredById: expect.any(Number),
            createdAt: mockCreatedAt,
            startedAt: mockStartedAt,
            completedAt: mockCompletedAt,
            updatedAt: mockCompletedAt,
          }),
        ]),
      );

      // Verify result
      expect(result).toEqual({
        message: 'Successfully seeded 600 ingestion jobs',
        duration: expect.any(String),
        total: 600,
      });

      // Verify logging
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting to seed 600 ingestion jobs...');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Batch 1/2 completed. Created 500/600 jobs');
      expect(Logger.prototype.log).toHaveBeenCalledWith('Batch 2/2 completed. Created 600/600 jobs');
      expect(Logger.prototype.log).toHaveBeenCalledWith(expect.stringContaining('Successfully seeded 600 jobs'));
    });

    it('should handle processing status with random progress', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      mockIngestionService.createBulkIngestionJobs.mockResolvedValue(undefined);

      // Mock Math.random to select 'processing' status and progress
      jest.spyOn(global.Math, 'random')
        .mockReturnValueOnce(0.12) // Selects 'processing' (0.1 < x < 0.15)
        .mockReturnValueOnce(0.5); // Progress: (0.5 * 80 + 10) = 50.00

      await service.seed(1);

      expect(mockIngestionService.createBulkIngestionJobs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'processing',
            progress: '50.00',
            documentId: expect.any(Number),
            triggeredById: expect.any(Number),
            createdAt: mockCreatedAt,
            startedAt: mockStartedAt,
            completedAt: null,
            updatedAt: mockStartedAt,
          }),
        ]),
      );
    });

    it('should handle failed status with error message', async () => {
      mockUserService.getAllUsers.mockResolvedValue(mockUsers);
      mockDocumentService.getAllDocuments.mockResolvedValue(mockDocuments);
      mockIngestionService.createBulkIngestionJobs.mockResolvedValue(undefined);

      // Mock Math.random to select 'failed' status
      jest.spyOn(global.Math, 'random').mockReturnValue(0.9); // Selects 'failed' (0.85 < x < 0.95)

      await service.seed(1);

      expect(mockIngestionService.createBulkIngestionJobs).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            status: 'failed',
            progress: '0.00',
            documentId: expect.any(Number),
            triggeredById: expect.any(Number),
            createdAt: mockCreatedAt,
            startedAt: mockStartedAt,
            completedAt: mockCompletedAt,
            updatedAt: mockCompletedAt,
            errorMessage: 'Error message',
          }),
        ]),
      );
    });

    afterEach(() => {
      jest.spyOn(global.Math, 'random').mockRestore();
    });
  });
});