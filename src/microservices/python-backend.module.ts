import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PythonBackendHttpClient } from './services/python-backend.http-client.service';
import { IngestionService } from './services/ingestion.service';
import { StatsService } from './services/stats.service';
import { PythonBackendConfig } from './interface/python-backend.interface';

@Module({
  imports: [
    HttpModule,
    ConfigModule
  ],
  providers: [
    {
      provide: 'PYTHON_BACKEND_CONFIG',
      useFactory: (cs: ConfigService): PythonBackendConfig => ({
        baseUrl: cs.get<string>('PYTHON_BACKEND_URL', 'http://localhost:8001'),
        apiKey: cs.get<string>('PYTHON_BACKEND_API_KEY', ''),
        timeout: cs.get<number>('PYTHON_BACKEND_TIMEOUT', 30_000),
        retryAttempts: cs.get<number>('PYTHON_BACKEND_RETRY_ATTEMPTS', 3),
      }),
      inject: [ConfigService],
    },
    PythonBackendHttpClient,
    IngestionService,
    StatsService,
  ],
  exports: [IngestionService, StatsService],
})
export class PythonBackendModule {}