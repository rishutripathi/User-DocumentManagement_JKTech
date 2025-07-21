import { Test, TestingModule } from '@nestjs/testing';
import { UserSeedingService } from './user-seeding.service';
import { DocumentSeedingService } from './document-seeding.service';
import { IngestionSeedingService } from './ingestion-seeding.service';
import { Logger } from '@nestjs/common';

describe('SeedingService', () => {
  let seedingService: UserSeedingService;
  let userSeedingService: jest.Mocked<UserSeedingService>;
  let documentSeedingService: jest.Mocked<DocumentSeedingService>;
  let ingestionSeedingService: jest.Mocked<IngestionSeedingService>;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [

        {
          provide: UserSeedingService,
          useValue: {
            seed: jest.fn(),
          },
        },
        {
          provide: DocumentSeedingService,
          useValue: {
            seed: jest.fn(),
          },
        },
        {
          provide: IngestionSeedingService,
          useValue: {
            seed: jest.fn(),
          },
        },
      ],
    }).compile();

    seedingService = module.get<UserSeedingService>(UserSeedingService);
    userSeedingService = module.get(UserSeedingService);
    documentSeedingService = module.get(DocumentSeedingService);
    ingestionSeedingService = module.get(IngestionSeedingService);

    // Spy on Logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seedAll', () => {
    it('should call all seeding services and return aggregated results', async () => {
      // Arrange
      const options = { userCount: 100, documentCount: 1000 };
      const userResult = { message: 'Seeded 100 users', duration: '1.23', total: 100 };
      const documentResult = { message: 'Seeded 1000 documents', duration: '5.67', total: 1000 };
      const ingestionResult = { message: 'Seeded 100 ingestion jobs', duration: '0.89', total: 100 };

      userSeedingService.seed.mockResolvedValue(userResult);
      documentSeedingService.seed.mockResolvedValue(documentResult);
      ingestionSeedingService.seed.mockResolvedValue(ingestionResult);

      // Act
      const result = await seedingService.seedAll(options);

      // Assert
      expect(userSeedingService.seed).toHaveBeenCalledWith(options.userCount);
      expect(documentSeedingService.seed).toHaveBeenCalledWith(options.documentCount);
      expect(ingestionSeedingService.seed).toHaveBeenCalledWith(Math.floor(options.documentCount * 0.1));
      expect(loggerSpy).toHaveBeenCalledWith('Starting complete database seeding...');
      expect(loggerSpy).toHaveBeenCalledWith(expect.stringContaining('Complete seeding finished in'));
      expect(result).toEqual({
        message: 'All data seeded successfully',
        totalDuration: expect.any(String),
        results: [userResult, documentResult, ingestionResult],
      });
    });

    it('should throw an error if userSeedingService fails', async () => {
      // Arrange
      const options = { userCount: 100, documentCount: 1000 };
      userSeedingService.seed.mockRejectedValue(new Error('User seeding failed'));

      // Act & Assert
      await expect(seedingService.seedAll(options)).rejects.toThrow('User seeding failed');
      expect(userSeedingService.seed).toHaveBeenCalledWith(options.userCount);
      expect(documentSeedingService.seed).not.toHaveBeenCalled();
      expect(ingestionSeedingService.seed).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Starting complete database seeding...');
    });

    it('should throw an error if documentSeedingService fails', async () => {
      // Arrange
      const options = { userCount: 100, documentCount: 1000 };
      const userResult = { message: 'Seeded 100 users', duration: '1.23', total: 100 };
      userSeedingService.seed.mockResolvedValue(userResult);
      documentSeedingService.seed.mockRejectedValue(new Error('Document seeding failed'));

      // Act & Assert
      await expect(seedingService.seedAll(options)).rejects.toThrow('Document seeding failed');
      expect(userSeedingService.seed).toHaveBeenCalledWith(options.userCount);
      expect(documentSeedingService.seed).toHaveBeenCalledWith(options.documentCount);
      expect(ingestionSeedingService.seed).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Starting complete database seeding...');
    });

    it('should throw an error if ingestionSeedingService fails', async () => {
      // Arrange
      const options = { userCount: 100, documentCount: 1000 };
      const userResult = { message: 'Seeded 100 users', duration: '1.23', total: 100 };
      const documentResult = { message: 'Seeded 1000 documents', duration: '5.67', total: 1000 };
      userSeedingService.seed.mockResolvedValue(userResult);
      documentSeedingService.seed.mockResolvedValue(documentResult);
      ingestionSeedingService.seed.mockRejectedValue(new Error('Ingestion seeding failed'));

      // Act & Assert
      await expect(seedingService.seedAll(options)).rejects.toThrow('Ingestion seeding failed');
      expect(userSeedingService.seed).toHaveBeenCalledWith(options.userCount);
      expect(documentSeedingService.seed).toHaveBeenCalledWith(options.documentCount);
      expect(ingestionSeedingService.seed).toHaveBeenCalledWith(Math.floor(options.documentCount * 0.1));
      expect(loggerSpy).toHaveBeenCalledWith('Starting complete database seeding...');
    });

    it('should calculate ingestion job count as 10% of documentCount', async () => {
      // Arrange
      const options = { userCount: 100, documentCount: 1000 };
      const userResult = { message: 'Seeded 100 users', duration: '1.23', total: 100 };
      const documentResult = { message: 'Seeded 1000 documents', duration: '5.67', total: 1000 };
      const ingestionResult = { message: 'Seeded 100 ingestion jobs', duration: '0.89', total: 100 };

      userSeedingService.seed.mockResolvedValue(userResult);
      documentSeedingService.seed.mockResolvedValue(documentResult);
      ingestionSeedingService.seed.mockResolvedValue(ingestionResult);

      // Act
      await seedingService.seedAll(options);

      // Assert
      expect(ingestionSeedingService.seed).toHaveBeenCalledWith(100); // 10% of 1000
    });
  });
});