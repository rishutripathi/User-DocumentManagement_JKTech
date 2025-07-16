import { Module } from '@nestjs/common';
import { SeedingController } from './controller/seeding.controller';
import { UserSeedingService } from './service/user-seeding.service';
import { UserModule } from '../user/user.module';
import { DocumentsModule } from '../documents/documents.module';
import { AuthModule } from '../auth/auth.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { CoordinatorSeedingService } from './service/coordinator-seeding.service';
import { DocumentSeedingService } from './service/document-seeding.service';
import { IngestionSeedingService } from './service/ingestion-seeding.service';
import { ResetSeedingService } from './service/reset-seeding.service';
import { UserSearchService } from 'src/user/service/user-search.service';
import { UserDeleteService } from 'src/user/service/user-delete.service';
import { UserCreateService } from 'src/user/service/user-create.service';
import { IngestionCommandService } from 'src/ingestion/services/ingestion-command.service';


@Module({
  imports: [
    UserModule,
    DocumentsModule,
    IngestionModule,
    AuthModule
  ],
  controllers: [SeedingController],
  providers: [
    CoordinatorSeedingService,
    DocumentSeedingService,
    IngestionSeedingService,
    IngestionCommandService,
    ResetSeedingService,
    UserSeedingService
  ],
  exports: [
    CoordinatorSeedingService,
    DocumentSeedingService,
    IngestionSeedingService,
    ResetSeedingService,
    UserSeedingService
  ],
})
export class SeedingModule {}
