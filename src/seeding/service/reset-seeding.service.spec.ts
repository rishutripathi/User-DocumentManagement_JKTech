import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ResetSeedingService } from './reset-seeding.service';
import { IDocumentsService, IIngestionService, IUserService } from '../interfaces/seeding.interface';

// Mock the Logger
jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

describe('ResetService', () => {
  let resetService: ResetSeedingService;
  let userService: jest.Mocked<IUserService>;
  let documentService: jest.Mocked<IDocumentsService>;
  let ingestionService: jest.Mocked<IIngestionService>;

  beforeEach(async () => {
    // Create mocks for the dependencies
    const userServiceMock = {
      deleteAllUsers: jest.fn().mockResolvedValue(undefined),
      getAllUsers: jest.fn(),
      bulkCreate: jest.fn(),
    } as jest.Mocked<IUserService>;

    const documentServiceMock = {
      deleteAllDocuments: jest.fn().mockResolvedValue(undefined),
      getAllDocuments: jest.fn(),
      uploadBulkDocuments: jest.fn(),
      createDocPermissions: jest.fn(),
    } as jest.Mocked<IDocumentsService>;

    const ingestionServiceMock = {
      deleteAllIngestionJobs: jest.fn().mockResolvedValue(undefined),
      createBulkIngestionJobs: jest.fn(),
    } as jest.Mocked<IIngestionService>;

    // Create the testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResetSeedingService,
        { provide: 'IUserService', useValue: userServiceMock },
        { provide: 'IDocumentsService', useValue: documentServiceMock },
        { provide: 'IIngestionService', useValue: ingestionServiceMock },
      ],
    }).compile();

    // Get instances
    resetService = module.get<ResetSeedingService>(ResetSeedingService);
    userService = module.get('IUserService');
    documentService = module.get('IDocumentsService');
    ingestionService = module.get('IIngestionService');

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe('resetAllData', () => {
    it('should call delete methods in the correct order and return success message', async () => {
      // Act
      const result = await resetService.resetAllData();

      // Assert
      expect(ingestionService.deleteAllIngestionJobs).toHaveBeenCalledTimes(1);
      expect(documentService.deleteAllDocuments).toHaveBeenCalledTimes(1);
      expect(userService.deleteAllUsers).toHaveBeenCalledTimes(1);

      // Verify order of calls
      const callOrder = [
        ingestionService.deleteAllIngestionJobs.mock.invocationCallOrder[0],
        documentService.deleteAllDocuments.mock.invocationCallOrder[0],
        userService.deleteAllUsers.mock.invocationCallOrder[0],
      ];
      expect(callOrder).toEqual([...callOrder].sort()); // Ensures calls are in sequence

      // Verify logging
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting database reset...');
      expect(Logger.prototype.log).toHaveBeenCalledWith('All data reset successfully');

      // Verify result
      expect(result).toEqual({ message: 'All data reset successfully' });
    });

    it('should throw an error if ingestionService.deleteAllIngestionJobs fails', async () => {
      // Arrange
      const error = new Error('Failed to delete ingestion jobs');
      ingestionService.deleteAllIngestionJobs.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(resetService.resetAllData()).rejects.toThrow('Failed to delete ingestion jobs');
      expect(ingestionService.deleteAllIngestionJobs).toHaveBeenCalledTimes(1);
      expect(documentService.deleteAllDocuments).not.toHaveBeenCalled();
      expect(userService.deleteAllUsers).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting database reset...');
      expect(Logger.prototype.log).not.toHaveBeenCalledWith('All data reset successfully');
    });

    it('should throw an error if documentService.deleteAllDocuments fails', async () => {
      // Arrange
      const error = new Error('Failed to delete documents');
      documentService.deleteAllDocuments.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(resetService.resetAllData()).rejects.toThrow('Failed to delete documents');
      expect(ingestionService.deleteAllIngestionJobs).toHaveBeenCalledTimes(1);
      expect(documentService.deleteAllDocuments).toHaveBeenCalledTimes(1);
      expect(userService.deleteAllUsers).not.toHaveBeenCalled();
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting database reset...');
      expect(Logger.prototype.log).not.toHaveBeenCalledWith('All data reset successfully');
    });

    it('should throw an error if userService.deleteAllUsers fails', async () => {
      // Arrange
      const error = new Error('Failed to delete users');
      userService.deleteAllUsers.mockRejectedValueOnce(error);

      // Act & Assert
      await expect(resetService.resetAllData()).rejects.toThrow('Failed to delete users');
      expect(ingestionService.deleteAllIngestionJobs).toHaveBeenCalledTimes(1);
      expect(documentService.deleteAllDocuments).toHaveBeenCalledTimes(1);
      expect(userService.deleteAllUsers).toHaveBeenCalledTimes(1);
      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting database reset...');
      expect(Logger.prototype.log).not.toHaveBeenCalledWith('All data reset successfully');
    });
  });
});