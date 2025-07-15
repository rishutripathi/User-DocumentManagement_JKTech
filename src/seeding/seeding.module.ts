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


@Module({
  imports: [
    UserModule,
    DocumentsModule,
    IngestionModule,
    AuthModule,
  ],
  controllers: [SeedingController],
  providers: [
    CoordinatorSeedingService,
    DocumentSeedingService,
    IngestionSeedingService,
    ResetSeedingService,
    UserSeedingService
  ],
  exports: [],
})
export class SeedingModule {}
