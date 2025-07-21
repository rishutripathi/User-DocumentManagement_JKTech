import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

// Mock the bcrypt library
jest.mock('bcrypt');

describe('PasswordService', () => {
  let service: PasswordService;
  const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    // Get an instance of the PasswordService
    service = module.get<PasswordService>(PasswordService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should hash a given password and return the hash', async () => {
      const password = 'mySecurePassword123';
      const hashedPassword = 'hashedPasswordString';
      const saltRounds = 12;

      // Mock the bcrypt.hash function to return a predefined value
      mockBcrypt.hash.mockResolvedValue(hashedPassword);

      // Call the method being tested
      const result = await service.hashPassword(password);

      // Assert that bcrypt.hash was called with the correct arguments
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, saltRounds);
      expect(mockBcrypt.hash).toHaveBeenCalledTimes(1);

      // Assert that the method returns the expected hashed password
      expect(result).toBe(hashedPassword);
    });

    it('should throw an error if bcrypt.hash fails', async () => {
        const password = 'mySecurePassword123';
        const error = new Error('Hashing failed');

        // Mock the bcrypt.hash function to reject with an error
        mockBcrypt.hash.mockRejectedValue(error);

        // Assert that calling the method throws the expected error
        await expect(service.hashPassword(password)).rejects.toThrow(error);
    });
  });

  describe('comparePassword', () => {
    it('should return true if the password matches the hash', async () => {
      const password = 'mySecurePassword123';
      const hash = 'hashedPasswordString';

      // Mock the bcrypt.compare function to resolve to true
      mockBcrypt.compare.mockResolvedValue(true);

      // Call the method being tested
      const result = await service.comparePassword(password, hash);

      // Assert that bcrypt.compare was called with the correct arguments
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);

      // Assert that the method returns true
      expect(result).toBe(true);
    });

    it('should return false if the password does not match the hash', async () => {
      const password = 'wrongPassword';
      const hash = 'hashedPasswordString';

      // Mock the bcrypt.compare function to resolve to false
      mockBcrypt.compare.mockResolvedValue(false);

      // Call the method being tested
      const result = await service.comparePassword(password, hash);

      // Assert that bcrypt.compare was called with the correct arguments
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(mockBcrypt.compare).toHaveBeenCalledTimes(1);

      // Assert that the method returns false
      expect(result).toBe(false);
    });

    it('should throw an error if bcrypt.compare fails', async () => {
        const password = 'mySecurePassword123';
        const hash = 'hashedPasswordString';
        const error = new Error('Comparison failed');

        // Mock the bcrypt.compare function to reject with an error
        mockBcrypt.compare.mockRejectedValue(error);

        // Assert that calling the method throws the expected error
        await expect(service.comparePassword(password, hash)).rejects.toThrow(error);
    });
  });
});
