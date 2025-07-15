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
import { IngestionCommandService } from '../services/ingestion-command.service';
import { IngestionQueryService } from '../services/ingestion-query.service';
import { IngestionStatsService } from '../services/ingestion-stats.service';
import { IngestionWebhookService } from '../services/ingestion-webhook.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';
import { CreateIngestionJobDto, GetIngestionJobsFilterDto } from '../DTO/ingestion.dto';
import { WebhookDto } from '../DTO/ingestion-webhook.dto';
import { UpdateUserDto } from 'src/user/DTO/user.dtos';
import { IngestionStatus } from 'src/common/enums/database.enums';

@ApiTags('ingestion')
@Controller('ingestion')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class IngestionController {
  constructor(
    private readonly commandService: IngestionCommandService,
    private readonly queryService: IngestionQueryService,
    private readonly statsService: IngestionStatsService,
    private readonly webhookService: IngestionWebhookService,
  ) {}

  @Get('jobs')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get all ingestion jobs' })
  @ApiResponse({ status: 200, description: 'Ingestion jobs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ['queued', 'processing', 'completed', 'failed', 'cancelled'] })
  async getAllIngestionJobs(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IngestionStatus
  ) {
    const filter: GetIngestionJobsFilterDto = {
      page: page || 1,
      limit: limit || 10,
      status
    };
    return this.queryService.list(user, filter);
  }

  @Get('jobs/:id')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get ingestion job by ID' })
  @ApiResponse({ status: 200, description: 'Ingestion job retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  async getIngestionJobById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.queryService.getById(user, id);
  }

  @Post('trigger')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Trigger document ingestion' })
  @ApiResponse({ status: 201, description: 'Ingestion job created successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async triggerIngestion(
    @CurrentUser() user: User,
    @Body() createIngestionJobDto: CreateIngestionJobDto,
  ) {
    return this.commandService.trigger(user, createIngestionJobDto);
  }

  @Put('jobs/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update ingestion job (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ingestion job updated successfully' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  async updateIngestionJob(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.commandService.updateStatus(id, updateDto);
  }

  @Put('jobs/:id/cancel')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Cancel ingestion job' })
  @ApiResponse({ status: 200, description: 'Ingestion job cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 400, description: 'Job cannot be cancelled' })
  async cancelIngestionJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.cancel(user, id);
  }

  @Put('jobs/:id/retry')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Retry failed ingestion job' })
  @ApiResponse({ status: 200, description: 'Ingestion job queued for retry' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  @ApiResponse({ status: 400, description: 'Job cannot be retried' })
  async retryIngestionJob(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandService.retry(user, id);
  }

  @Delete('jobs/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete ingestion job (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ingestion job deleted successfully' })
  @ApiResponse({ status: 404, description: 'Ingestion job not found' })
  async deleteIngestionJob(@Param('id', ParseIntPipe) id: number) {
    return this.commandService.delete(id);
  }

  @Get('stats')
  @Roles('admin', 'editor')
  @ApiOperation({ summary: 'Get ingestion statistics' })
  @ApiResponse({ status: 200, description: 'Ingestion statistics retrieved successfully' })
  async getIngestionStats(@CurrentUser() user: User) {
    return this.statsService.getStats();
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook endpoint for Python backend updates' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleIngestionWebhook(@Body() webhookData: WebhookDto) {
    return this.webhookService.handle(webhookData);
  }

  @Get('my/jobs')
  @ApiOperation({ summary: 'Get current user ingestion jobs' })
  @ApiResponse({ status: 200, description: 'User ingestion jobs retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getMyIngestionJobs(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filter: GetIngestionJobsFilterDto = {
      page: page || 1,
      limit: limit || 10,
    };
    return this.queryService.listByUser(user.id, filter);
  }
}