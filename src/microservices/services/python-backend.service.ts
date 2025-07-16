import { Injectable, Logger } from "@nestjs/common";
import { IngestionRequest, IngestionResponse, PythonBackendConfig } from "../interface/python-backend.interface";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { firstValueFrom } from "rxjs";


@Injectable()
export class PythonBackendService {
  private readonly logger = new Logger(PythonBackendService.name);
  private readonly config: PythonBackendConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = {
      baseUrl: this.configService.get<string>(
        'PYTHON_BACKEND_URL',
        'http://localhost:8001',
      ),
      apiKey: this.configService.get<string>(
        'PYTHON_BACKEND_API_KEY',
        '',
      ),
      timeout: parseInt(
        this.configService.get<string>(
          'PYTHON_BACKEND_TIMEOUT',
          '30000',
        ),
        10,
      ),
      retryAttempts: parseInt(
        this.configService.get<string>(
          'PYTHON_BACKEND_RETRY_ATTEMPTS',
          '3',
        ),
        10,
      ),
    };
  }

  async triggerDocumentIngestion(request: IngestionRequest): Promise<IngestionResponse> {
    const url = `${this.config.baseUrl}/api/ingest`;
    
    this.logger.log(`Triggering document ingestion for job ${request.jobId}`);
    
    try {
      const response = await firstValueFrom(
        this.httpService.post<IngestionResponse>(url, request, {
          timeout: this.config.timeout,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.configService.get('PYTHON_BACKEND_API_KEY', ''),
          },
        })
      );

      this.logger.log(`Ingestion triggered successfully for job ${request.jobId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to trigger ingestion for job ${request.jobId}:`, error);
      throw error;
    }
  }

  async getIngestionStatus(jobId: number): Promise<any> {
    const url = `${this.config.baseUrl}/api/ingest/${jobId}/status`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: this.config.timeout,
          headers: {
            'X-API-Key': this.configService.get('PYTHON_BACKEND_API_KEY', ''),
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get ingestion status for job ${jobId}:`, error);
      throw error;
    }
  }

  async cancelIngestion(jobId: number): Promise<any> {
    const url = `${this.config.baseUrl}/api/ingest/${jobId}/cancel`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {}, {
          timeout: this.config.timeout,
          headers: {
            'X-API-Key': this.configService.get('PYTHON_BACKEND_API_KEY', ''),
          },
        })
      );

      this.logger.log(`Ingestion cancelled successfully for job ${jobId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to cancel ingestion for job ${jobId}:`, error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    const url = `${this.config.baseUrl}/health`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: 5000, // Short timeout for health check
        })
      );

      return response.status === 200;
    } catch (error) {
      this.logger.warn('Python backend health check failed:', error.message);
      return false;
    }
  }

  async getSystemStats(): Promise<any> {
    const url = `${this.config.baseUrl}/api/stats`;
    
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          timeout: this.config.timeout,
          headers: {
            'X-API-Key': this.configService.get('PYTHON_BACKEND_API_KEY', ''),
          },
        })
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get system stats from Python backend:', error);
      throw error;
    }
  }
}
