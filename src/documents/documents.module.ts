import { Module } from '@nestjs/common';
import { DocumentsController } from './controller/documents.controller';
import { AuthModule } from 'src/auth/auth.module';
import { DocumentRepository } from './repository/documents.repository';
import { DocumentPermissionRepository } from './repository/document_permissions.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { Document } from './models/document.model';
import { DocumentPermission } from './models/document_permissions.model';
import { DocumentBatchService } from './services/document-batch.service';
import { DocumentCommandService } from './services/document-command.service';
import { DocumentQueryService } from './services/document-query.service';
import { PermissionService } from './services/permission.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([Document, DocumentPermission])
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentRepository, 
    DocumentPermissionRepository,
    DocumentBatchService,
    DocumentCommandService,
    DocumentQueryService,
    PermissionService,
    StorageService
  ],
  exports: [
    DocumentPermissionRepository,
    DocumentBatchService,
    DocumentCommandService,
    DocumentQueryService,
    PermissionService,
    StorageService
  ]
})
export class DocumentsModule {}
