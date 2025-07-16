import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  ParseIntPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from '../models/user.model';
import { CreateUserDto, UpdateUserDto, UpdateUserRoleDto } from '../DTO/user.dtos';
import { UserRoleEnum } from '../enum/user.enum';
import { UserSearchService } from '../service/user-search.service';
import { UserCreateService } from '../service/user-create.service';
import { UserUpdateService } from '../service/user-update.service';
import { UserDeleteService } from '../service/user-delete.service';


@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(
    private readonly userSearcher: UserSearchService,
    private readonly userCreator: UserCreateService,
    private readonly userUpdater: UserUpdateService,
    private readonly userDeleter: UserDeleteService,
  ) {}

  // Admin roles
  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all users (admin access)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, enum: UserRoleEnum })
  async getAdminUsers(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
    @Query('role') role: UserRoleEnum
  ) {
    return this.userSearcher.getAllUsers_Paginated({
      page: page || 1,
      limit: limit || 10,
      search,
      role
    });
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.userSearcher.getUserById(id);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userCreator.createUser(createUserDto);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.userUpdater.updateUser(id, updateUserDto);
  }

  @Put(':id/role')
  @Roles('admin')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ) {
    return this.userUpdater.updateUserRole(id, updateUserRoleDto);
  }

  @Put(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.userUpdater.toggleUserStatus(id);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.userDeleter.deleteUser(id);
  }

  // General roles
  @Get('profile/me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getCurrentUserProfile(@CurrentUser() user: User) {
    return this.userSearcher.getUserById(user.id);
  }

  @Put('profile/me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateCurrentUserProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userUpdater.updateUser(user.id, updateUserDto);
  }
}