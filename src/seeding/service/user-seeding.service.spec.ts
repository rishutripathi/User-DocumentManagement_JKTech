import { Test, TestingModule } from '@nestjs/testing';
import { UserSeedingService } from './user-seeding.service';
import { IUserService } from '../interfaces/seeding.interface';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import { UserRoleEnum } from 'src/user/enum/user.enum';
import { Logger } from '@nestjs/common';


// Define the User interface to type the user objects
interface User {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRoleEnum;
  isActive: boolean;
  lastLoginAt: Date;
}

// Mock bcrypt and faker
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

jest.mock('@faker-js/faker', () => ({
  faker: {
    person: {
      firstName: jest.fn(),
      lastName: jest.fn(),
    },
    internet: {
      userName: jest.fn(),
      email: jest.fn(),
    },
    lorem: {
      word: jest.fn(),
    },
    date: {
      recent: jest.fn(),
    },
  },
}));

describe('UserSeedingService', () => {
  let service: UserSeedingService;
  let userService: jest.Mocked<IUserService>;

  // Mock implementation of IUserService
  const mockUserService = {
    bulkCreate: jest.fn(),
    getAllUsers: jest.fn(),
    deleteAllUsers: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSeedingService,
        {
          provide: 'IUserService',
          useValue: mockUserService,
        },
      ],
    }).compile();

    // Mock Logger to prevent actual logging during tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

    service = module.get<UserSeedingService>(UserSeedingService);
    userService = module.get('IUserService');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('seed', () => {
    const mockHashedPasswords = ['hash1', 'hash2', 'hash3', 'hash4'];
    const mockFirstName = 'John';
    const mockLastName = 'Doe';
    const mockUsername = 'johndoe';
    const mockEmail = 'john.doe@example.com';

    beforeEach(() => {
      // Mock bcrypt.hash to return pre-hashed passwords
      (bcrypt.hash as jest.Mock).mockImplementation((pwd, rounds) =>
        Promise.resolve(mockHashedPasswords[0]),
      );

      // Mock faker methods
      (faker.person.firstName as jest.Mock).mockReturnValue(mockFirstName);
      (faker.person.lastName as jest.Mock).mockReturnValue(mockLastName);
      (faker.internet.userName as jest.Mock).mockReturnValue(mockUsername);
      (faker.internet.email as jest.Mock).mockReturnValue(mockEmail);
      (faker.date.recent as jest.Mock).mockReturnValue(new Date('2025-07-14T10:00:00Z'));
    });

    it('should seed the specified number of users in batches', async () => {
      const count = 250;
      const batchSize = 100;
      userService.bulkCreate.mockResolvedValue(undefined);

      // Mock Math.random to control role assignment (all VIEWER for simplicity)
      jest.spyOn(global.Math, 'random').mockReturnValue(0.8);

      const result = await service.seed(count);

      expect(userService.bulkCreate).toHaveBeenCalledTimes(3); // 2 full batches + 1 partial (100, 100, 50)
      expect(userService.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            username: expect.stringContaining(mockUsername),
            email: expect.stringContaining(mockEmail),
            password: mockHashedPasswords[0],
            firstName: mockFirstName,
            lastName: mockLastName,
            role: UserRoleEnum.VIEWER,
            isActive: expect.any(Boolean),
            lastLoginAt: expect.any(Date),
          }),
        ]),
      );
      expect(result).toEqual({
        message: `Successfully seeded ${count} users`,
        duration: expect.any(String),
        total: count,
      });
    });

    it('should assign roles based on weights (5% ADMIN, 25% EDITOR, 70% VIEWER)', async () => {
      const count = 100;
      userService.bulkCreate.mockResolvedValue(undefined);

      // Mock Math.random to simulate role distribution
      let callCount = 0;
      const randomValues = [
        ...Array(5).fill(0.01), // 5% ADMIN
        ...Array(25).fill(0.1), // 25% EDITOR
        ...Array(70).fill(0.8), // 70% VIEWER
      ];
      jest.spyOn(global.Math, 'random').mockImplementation(() => randomValues[callCount++ % 100]);

      await service.seed(count);

      // Type the mock calls as User[]
      const calls = userService.bulkCreate.mock.calls as unknown as User[][];
      const users = calls.flat();
      const roles = users.map(user => user.role);

      expect(roles.filter(role => role === UserRoleEnum.ADMIN).length).toBeCloseTo(5, 1);
      expect(roles.filter(role => role === UserRoleEnum.EDITOR).length).toBeCloseTo(25, 1);
      expect(roles.filter(role => role === UserRoleEnum.VIEWER).length).toBeCloseTo(70, 1);
    });

    it('should use pre-hashed passwords', async () => {
      const count = 10;
      userService.bulkCreate.mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockImplementation((pwd, rounds, cb) =>
        Promise.resolve(mockHashedPasswords[mockHashedPasswords.length % 4]),
      );

      await service.seed(count);

      const calls = userService.bulkCreate.mock.calls as unknown as User[][];
      const users = calls.flat();
      users.forEach(user => {
        expect(mockHashedPasswords).toContain(user.password);
      });
      expect(bcrypt.hash).toHaveBeenCalledTimes(4); // Once per common password
    });

    it('should throw an error if userService.bulkCreate fails', async () => {
      const count = 100;
      const error = new Error('Database error');
      userService.bulkCreate.mockRejectedValue(error);

      await expect(service.seed(count)).rejects.toThrow('Database error');
      expect(Logger.prototype.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create batch'),
        expect.anything(),
      );
    });

    it('should handle single batch for small count', async () => {
      const count = 50;
      userService.bulkCreate.mockResolvedValue(undefined);

      const result = await service.seed(count);

      expect(userService.bulkCreate).toHaveBeenCalledTimes(1); // Only one batch
      expect(userService.bulkCreate).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ firstName: mockFirstName })]),
      );
      expect(result.total).toBe(50);
    });

    it('should log progress and completion', async () => {
      const count = 100;
      userService.bulkCreate.mockResolvedValue(undefined);

      await service.seed(count);

      expect(Logger.prototype.log).toHaveBeenCalledWith('Starting to seed 100 users...');
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Batch 1/1 completed. Created 100/100 users'),
      );
      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining('Successfully seeded 100 users in'),
      );
    });
  });
});