import { Controller, Post, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoordinatorSeedingService } from '../service/coordinator-seeding.service';
import { UserSeedingService } from '../service/user-seeding.service';
import { DocumentSeedingService } from '../service/document-seeding.service';
import { IngestionSeedingService } from '../service/ingestion-seeding.service';
import { ResetSeedingService } from '../service/reset-seeding.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';


@ApiTags('seeding')
@Controller('seeding')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SeedingController {
  constructor(
    private readonly coSeedingService: CoordinatorSeedingService,
    private readonly userSeedingService: UserSeedingService,
    private readonly documentSeedingService: DocumentSeedingService,
    private readonly ingestionSeedingService: IngestionSeedingService,
    private readonly resetService: ResetSeedingService
  ) {}

  @Post('users')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed users data by Admin' })
  @ApiResponse({ status: 201, description: 'Users seeded successfully' })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of users to create' })
  @ApiQuery({ name: 'user', required: true, type: User, description: 'User' })
  async seedUsers(
    @Query('count') count?: number
  ) {
    return this.userSeedingService.seed(count || 1000);
  }

  @Post('documents')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed documents data by Admin' })
  @ApiResponse({ status: 201, description: 'Documents seeded successfully' })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of documents to create' })
  async seedDocuments(
    @Query('count') count?: number
  ) {
    return this.documentSeedingService.seed(count || 100000);
  }

  @Post('ingestion')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed ingestion jobs data by Admin' })
  @ApiResponse({ status: 201, description: 'Ingestion jobs seeded successfully' })
  @ApiQuery({ name: 'count', required: false, type: Number, description: 'Number of ingestion jobs to create' })
  async seedIngestion(
    @CurrentUser() user: User,
    @Query('count') count?: number
  ) {
    return this.ingestionSeedingService.seed(user, count || 10000);
  }

  @Post('all')
  @Roles('admin')
  @ApiOperation({ summary: 'Seed all data by Admin' })
  @ApiResponse({ status: 201, description: 'All data seeded successfully' })
  @ApiQuery({ name: 'userCount', required: false, type: Number })
  @ApiQuery({ name: 'documentCount', required: false, type: Number })
  async seedAll(
    @Query('userCount') userCount?: number,
    @Query('documentCount') documentCount?: number,
  ) {
    return this.coSeedingService.seedAll({
      userCount: userCount || 1000,
      documentCount: documentCount || 100000,
    });
  }

  @Post('reset')
  @Roles('admin')
  @ApiOperation({ summary: 'Reset all data by Admin' })
  @ApiResponse({ status: 200, description: 'Data reset successfully' })
  async resetData() {
    return this.resetService.resetAllData();
  }
}