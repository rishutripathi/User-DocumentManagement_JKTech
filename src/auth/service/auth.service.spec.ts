import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserSearchService } from 'src/user/service/user-search.service';
import { UserCreateService } from 'src/user/service/user-create.service';
import { UserUpdateService } from 'src/user/service/user-update.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionService } from './session.service';
import { LoginDto, RegisterDto, ChangePasswordDto } from '../dto/auth.dto';
import { User } from 'src/user/models/user.model';
import { UserRoleEnum } from 'src/user/enum/user.enum';
import { UserRole } from 'src/common/enums/database.enums';
import { Mock } from 'node:test';

describe('AuthService', () => {
  let service: AuthService;
  let userSearchService: jest.Mocked<UserSearchService>;
  let userCreateService: jest.Mocked<UserCreateService>;
  let userUpdateService: jest.Mocked<UserUpdateService>;
  let passwordService: jest.Mocked<PasswordService>;
  let tokenService: jest.Mocked<TokenService>;
  let sessionService: jest.Mocked<SessionService>;

  const mockUser: Partial<User> = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.ADMIN,
    isActive: true,
    password: 'hashedPassword123'
  };

  const mockUserWithSequelizeModel = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRoleEnum.ADMIN,
    isActive: true,
    password: 'hashedPassword123',
    lastLoginAt: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    _model: {} as any,
    _attributes: {},
    dataValues: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      // include all other properties here
    },
    _creationAttributes: {},
    isNewRecord: false,
    sequelize: {} as any
  };

  const mockUserWithoutPassword = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: UserRoleEnum.ADMIN,
    isActive: true
  };

  beforeEach(async () => {
    const mockUserSearchService = {
      getUserByEmail: jest.fn(),
      getUserByUsername: jest.fn(),
      getUserById: jest.fn(),
      getUserAndPassById: jest.fn(),
      getAllUsers_Paginated: jest.fn(),
    };

    const mockUserCreateService = {
      createUser: jest.fn(),
    };

    const mockUserUpdateService = {
      updateUser: jest.fn(),
    };

    const mockPasswordService = {
      hashPassword: jest.fn(),
      comparePassword: jest.fn(),
    };

    const mockTokenService = {
      generateToken: jest.fn(),
      generateTokenId: jest.fn(),
    };

    const mockSessionService = {
      createSession: jest.fn(),
      invalidateSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserSearchService, useValue: mockUserSearchService },
        { provide: UserCreateService, useValue: mockUserCreateService },
        { provide: UserUpdateService, useValue: mockUserUpdateService },
        { provide: PasswordService, useValue: mockPasswordService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userSearchService = module.get(UserSearchService);
    userCreateService = module.get(UserCreateService);
    userUpdateService = module.get(UserUpdateService);
    passwordService = module.get(PasswordService);
    tokenService = module.get(TokenService);
    sessionService = module.get(SessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      role: UserRoleEnum.ADMIN
    };

    it('should successfully register a new user', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(null);
      userSearchService.getUserByUsername.mockResolvedValue(null);
      passwordService.hashPassword.mockResolvedValue('hashedPassword123');
      userCreateService.createUser.mockResolvedValue(mockUser as any);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(userSearchService.getUserByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userSearchService.getUserByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(passwordService.hashPassword).toHaveBeenCalledWith(registerDto.password);
      expect(userCreateService.createUser).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        password: 'hashedPassword123',
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: registerDto.role,
      });
      expect(result).toEqual({
        message: 'User registered successfully',
        user: mockUser,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(mockUser as User);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists')
      );
      expect(userSearchService.getUserByUsername).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(null);
      userSearchService.getUserByUsername.mockResolvedValue(mockUser as User);

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Username already taken')
      );
      expect(passwordService.hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(mockUser as User);
      passwordService.comparePassword.mockResolvedValue(true);
      tokenService.generateToken.mockReturnValue('access_token_123');
      tokenService.generateTokenId.mockReturnValue('token_id_123');
      sessionService.createSession.mockResolvedValue(undefined);

      // Act
      const result = await service.login(loginDto);

      // Assert
      expect(userSearchService.getUserByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateTokenId).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith('token_id_123');
      expect(result).toEqual({
        access_token: 'access_token_123',
        user: mockUserWithoutPassword,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      userSearchService.getUserByEmail.mockResolvedValue(inactiveUser as User);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      // Arrange
      userSearchService.getUserByEmail.mockResolvedValue(mockUser as User);
      passwordService.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials')
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      // Arrange
      const tokenId = 'token_id_123';
      sessionService.invalidateSession.mockResolvedValue(undefined);

      // Act
      const result = await service.logout(tokenId);

      // Assert
      expect(sessionService.invalidateSession).toHaveBeenCalledWith(tokenId);
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('validateUser', () => {
    it('should return users when validation succeeds', async () => {
      // Arrange
      const userId = 1;
      const tokenId = 'token_id_123';
      const paginatedResult = {
        users: [mockUserWithSequelizeModel],
        pagination: { total: 1, page: 1, limit: 1, totalPages: 1 }
      };
      
      userSearchService.getAllUsers_Paginated.mockResolvedValue(paginatedResult as any);

      // Act
      const result = await service.validateUser(userId, tokenId);

      // Assert
      expect(userSearchService.getAllUsers_Paginated).toHaveBeenCalledWith({
        page: 1,
        limit: 1,
        search: JSON.stringify({
          $and: [
            { id: { $eq: userId } },
            { isActive: { $eq: true } },
          ],
        }),
      });
      expect(result).toEqual([mockUserWithSequelizeModel]);
    });

    it('should return null when no users found', async () => {
      // Arrange
      const userId = 1;
      const tokenId = 'token_id_123';
      const paginatedResult = {
        users: [] as any[],
        pagination: { total: 0, page: 1, limit: 1, totalPages: 1 }
      };
      userSearchService.getAllUsers_Paginated.mockResolvedValue(paginatedResult);

      // Act
      const result = await service.validateUser(userId, tokenId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when users is null', async () => {
      // Arrange
      const userId = 1;
      const tokenId = 'token_id_123';
      const paginatedResult = {
        users: null as any,
        pagination: { 
          total: 0, 
          page: 1, 
          limit: 1, 
          totalPages: 1 
        }
      };
      userSearchService.getAllUsers_Paginated.mockResolvedValue(paginatedResult);

      // Act
      const result = await service.validateUser(userId, tokenId);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserById.mockResolvedValue({
        isActive: false,
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRoleEnum.ADMIN,
        lastLoginAt: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        _model: {} as any
      } as unknown as User);

      // Act
      const result = await service.getProfile(userId);

      // Assert
      expect(userSearchService.getUserById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUserWithoutPassword);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserById.mockResolvedValue({
        isActive: false,
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRoleEnum.ADMIN,
        lastLoginAt: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        _model: {} as any
      } as unknown as User);

      // Act & Assert
      await expect(service.getProfile(userId)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });
  });

  describe('changePassword', () => {
    const changePasswordDto: ChangePasswordDto = {
      currentPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    /* it('should successfully change password', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserAndPassById.mockResolvedValue(mockUser as User);
      passwordService.comparePassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue('hashedNewPassword123');
      userUpdateService.updateUser.mockResolvedValue();

      // Act
      const result = await service.changePassword(userId, changePasswordDto);

      // Assert
      expect(userSearchService.getUserAndPassById).toHaveBeenCalledWith(userId);
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        changePasswordDto.newPassword
      );
      expect(userUpdateService.updateUser).toHaveBeenCalledWith(userId, {
        password: 'hashedNewPassword123',
        errorMessage: undefined,
        resultData: undefined,
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    }); */

    it('should successfully change password', async () => {
      // Arrange
      const userId = 1;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword123',
      };

      // Create a proper mock user with all required properties
      const mockUserWithPassword = {
        ...mockUserWithSequelizeModel,
        password: 'hashedPassword123'
      };

      userSearchService.getUserAndPassById.mockResolvedValue(mockUserWithPassword as any);
      passwordService.comparePassword.mockResolvedValue(true);
      passwordService.hashPassword.mockResolvedValue('hashedNewPassword123');

      // Act
      const result = await service.changePassword(userId, changePasswordDto);

      // Assert
      expect(userSearchService.getUserAndPassById).toHaveBeenCalledWith(userId);
      expect(passwordService.comparePassword).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUserWithPassword.password
      );
      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        changePasswordDto.newPassword
      );
      expect(userUpdateService.updateUser).toHaveBeenCalledWith(userId, {
        password: 'hashedNewPassword123',
      });
      expect(result).toEqual({ message: 'Password changed successfully' });
    });
    
    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserAndPassById.mockResolvedValue(User as any);

      // Act & Assert
      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        new UnauthorizedException('User not found')
      );
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserAndPassById.mockResolvedValue(mockUser as User);
      passwordService.comparePassword.mockResolvedValue(false);

      // Act & Assert
      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        new BadRequestException('Current password is incorrect')
      );
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserById.mockResolvedValue(mockUserWithoutPassword as any);
      tokenService.generateToken.mockReturnValue('new_access_token_123');
      tokenService.generateTokenId.mockReturnValue('new_token_id_123');
      sessionService.createSession.mockResolvedValue(undefined);

      // Act
      const result = await service.refreshToken(userId);

      // Assert
      expect(userSearchService.getUserById).toHaveBeenCalledWith(userId);
      expect(tokenService.generateToken).toHaveBeenCalledWith(mockUserWithoutPassword);
      expect(tokenService.generateTokenId).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith('new_token_id_123');
      expect(result).toEqual({ access_token: 'new_access_token_123' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      // Arrange
      const userId = 1;
      userSearchService.getUserById.mockResolvedValue(User as any);

      // Act & Assert
      await expect(service.refreshToken(userId)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive')
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      // Arrange
      const userId = 1;
      const inactiveUser = {
        isActive: false,
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: UserRoleEnum.ADMIN,
        lastLoginAt: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        _model: {} as any
      } as unknown as User;
      userSearchService.getUserById.mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(service.refreshToken(userId)).rejects.toThrow(
        new UnauthorizedException('User not found or inactive')
      );
    });
  });
});