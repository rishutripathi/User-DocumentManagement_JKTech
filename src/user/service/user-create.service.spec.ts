import { Test, TestingModule } from '@nestjs/testing';
import { UserCreateService } from './user-create.service';
import { CreateUserDto } from '../DTO/user.dtos';
import { UserRoleEnum } from '../enum/user.enum';
import * as bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import { UserRepository } from '../repository/user.repository';


// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UserCreator', () => {
  let service: UserCreateService;
  let userRepository: jest.Mocked<UserRepository>;

  // Mock implementation of IUserRepository
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserCreateService,
        {
          provide: 'IUserRepository',
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserCreateService>(UserCreateService);
    userRepository = module.get('IUserRepository');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockCreateUserDto: CreateUserDto = {
      username: 'johndoe',
      email: 'john.doe@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      role: UserRoleEnum.VIEWER,
    };

    // Define the mock user object with necessary properties
    const mockUser = {
      id: 1,
      username: mockCreateUserDto.username,
      email: mockCreateUserDto.email,
      password: 'hashedPassword123',
      firstName: mockCreateUserDto.firstName,
      lastName: mockCreateUserDto.lastName,
      role: mockCreateUserDto.role,
      isActive: true,
      lastLoginAt: null,
      created_at: new Date('2025-07-14T10:00:00Z'),
      updated_at: new Date('2025-07-14T10:00:00Z'),
    };

    beforeEach(() => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
    });

    it('should create a user successfully when no conflicts exist', async () => {
      // Arrange
      userRepository.findOne.mockResolvedValue(null); // No existing user
      // Use `as any` to bypass the Sequelize model method requirements
      userRepository.create.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.createUser(mockCreateUserDto);

      // Assert
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { [Op.or]: [{ email: mockCreateUserDto.email }, { username: mockCreateUserDto.username }] },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(mockCreateUserDto.password, 12);
      expect(userRepository.create).toHaveBeenCalledWith({
        ...mockCreateUserDto,
        password: 'hashedPassword123',
      });
      expect(result).toEqual({ message: 'User created successfully' });
    });
  });
});