import { Module } from '@nestjs/common';
import { IngestionController } from './controller/ingestion.controller';
import { DocumentsModule } from 'src/documents/documents.module';
import { AuthModule } from 'src/auth/auth.module';
import { IngestionRepository } from './repository/ingestion.repository';
import { SequelizeModule } from '@nestjs/sequelize';
import { IngestionJob } from './models/ingestion_jobs.model';
import { IngestionCommandService } from './services/ingestion-command.service';
import { IngestionQueryService } from './services/ingestion-query.service';
import { IngestionStateMachineService } from './services/ingestion-state-machine.service';
import { IngestionStatsService } from './services/ingestion-stats.service';
import { IngestionWebhookService } from './services/ingestion-webhook.service';


@Module({
  imports: [
    SequelizeModule.forFeature([IngestionJob]),
    DocumentsModule, 
    AuthModule
  ],
  controllers: [IngestionController],
  providers: [
    IngestionRepository,
    IngestionCommandService,
    IngestionQueryService,
    IngestionStateMachineService,
    IngestionStatsService,
    IngestionWebhookService
  ],
  exports: []
})
export class IngestionModule {}
