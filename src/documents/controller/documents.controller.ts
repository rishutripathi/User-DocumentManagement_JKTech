import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response, Request } from 'express';
import { createReadStream } from 'fs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiQuery,
} from '@nestjs/swagger';

import { DocumentQueryService } from '../services/document-query.service';
import { DocumentCommandService } from '../services/document-command.service';
import { DocumentBatchService } from '../services/document-batch.service';
import { CreateDocumentDto, UpdateDocumentDto } from '../DTO/documents.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { User } from 'src/user/models/user.model';
import { DocumentStatus } from 'src/common/enums/database.enums';


@ApiTags('documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(
    private readonly querySvc: DocumentQueryService,
    private readonly commandSvc: DocumentCommandService,
    private readonly batchSvc: DocumentBatchService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all documents (paginated)' })
  @ApiResponse({ status: 200, description: 'Documents retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllDocuments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.querySvc.getAllPaginated({
      page: page || 1,
      limit: limit || 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document by ID' })
  @ApiResponse({ status: 200, description: 'Document retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('user', 'admin')
  async getDocumentById(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    // RolesGuard + @Roles ensure only admin or owner can call
    const doc = await this.querySvc.getById(user, id);
    return {
      ...doc,
      uploadedBy: { id: user.id, username: user.username } 
    };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @Roles('user', 'admin')
  async uploadDocument(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
    @Body() createDto: CreateDocumentDto,
  ) {
    return this.commandSvc.create(user, file, createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('user', 'admin')
  async updateDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateDocumentDto,
  ) {
    return this.commandSvc.update(user, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('user', 'admin')
  async deleteDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.commandSvc.delete(user, id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({ status: 200, description: 'Document file downloaded successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('user', 'admin')
  async downloadDocument(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.querySvc.getById(user, id);
    const stream = createReadStream(doc.filePath);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `attachment; filename="${doc.fileName}"`,
    });
    return new StreamableFile(stream);
  }

  @Put(':id/permissions')
  @ApiOperation({ summary: 'Update document permissions' })
  @ApiResponse({ status: 200, description: 'Permissions updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('admin', 'editor')
  async updateDocumentPermissions(
    @Param('id', ParseIntPipe) id: number,
    @Body() permissionsDto: any,
  ) {
    return this.commandSvc.update(permissionsDto.user, id, permissionsDto);
  }

  @Get('my/documents')
  @ApiOperation({ summary: 'Get current user documents' })
  @ApiResponse({ status: 200, description: 'User documents retrieved successfully' })
  @Roles('user', 'admin')
  async getMyDocuments(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.querySvc.getUserDocuments(user.id, {
      page: page || 1,
      limit: limit || 10,
    });
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk upload documents' })
  @ApiResponse({ status: 201, description: 'Bulk upload completed' })
  @Roles('admin')
  async bulkCreate(
    @Body('documents') docs: any[],
  ) {
    return this.batchSvc.bulkCreate(docs);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update document status' })
  @ApiResponse({ status: 200, description: 'Document status updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @Roles('admin')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DocumentStatus,
  ) {
    return this.commandSvc.updateStatus(id, status);
  }
}
