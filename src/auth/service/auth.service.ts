import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { LoginDto, RegisterDto, ChangePasswordDto } from '../dto/auth.dto';
import { UserSearchService } from 'src/user/service/user-search.service';
import { SessionService } from './session.service';
import { User } from 'src/user/models/user.model';
import { Op } from 'sequelize';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { UserCreateService } from 'src/user/service/user-create.service';
import { UserUpdateService } from 'src/user/service/user-update.service';
import { GetUsersFilterDto } from 'src/user/DTO/user.dtos';



@Injectable()
export class AuthService {
  constructor(
    private readonly userSService: UserSearchService,
    private readonly userCService: UserCreateService,
    private readonly userUService: UserUpdateService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password, firstName, lastName, role } = registerDto;

    // Check if user already exists
    const existingUser = await this.userSService.getUserByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const existingUsername = await this.userSService.getUserByUsername(username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await this.passwordService.hashPassword(password);

    // Create user
    const newUser = {
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    };

    const createdUser = await this.userCService.createUser(newUser);

    // Remove password from response
    const { ...userWithoutPassword } = createdUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userSService.getUserByEmail(email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token and store session
    const accessToken = this.tokenService.generateToken(user);
    const tokenId = this.tokenService.generateTokenId();
    await this.sessionService.createSession(tokenId);

    const { password: _, ...userWithoutPassword } = user;

    return {
      access_token: accessToken,
      user: userWithoutPassword,
    };
  }

  async logout(tokenId: string) {
    await this.sessionService.invalidateSession(tokenId);
    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: number, tokenId: string): Promise<User[] | null> {
    // Validate user and session
    const { users } = await this.userSService.getAllUsers_Paginated({
      page: 1,
      limit: 1,
      search: JSON.stringify({
        [Op.and]: [
          { id: { [Op.eq]: userId } },
          { isActive: { [Op.eq]: true } },
        ],
      }),
    });

    if (!users || !users?.length) {
      return null;
    }

    return users.map(user => user as User);;
  }

  async getProfile(userId: number) {
    const userWithoutPassword = await this.userSService.getUserById(userId);
    if (!userWithoutPassword) {
      throw new UnauthorizedException('User not found');
    }
    return userWithoutPassword;
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userSService.getUserAndPassById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.passwordService.hashPassword(newPassword);

    // Update password
    await this.userUService.updateUser(userId, {
      password: hashedNewPassword,
      errorMessage: undefined,
      resultData: undefined
    });

    return { message: 'Password changed successfully' };
  }

  async refreshToken(userId: number) {
    const user: Partial<User> = await this.userSService.getUserById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new token and store session
    const accessToken = this.tokenService.generateToken(user as User);
    const tokenId = this.tokenService.generateTokenId();
    await this.sessionService.createSession(tokenId);

    return { access_token: accessToken };
  }
}