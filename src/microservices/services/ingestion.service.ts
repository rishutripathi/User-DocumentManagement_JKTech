import { Injectable } from '@nestjs/common';
import { PythonBackendHttpClient } from './python-backend.http-client.service';
import { IngestionRequest, IngestionResponse } from '../interface/python-backend.interface';


@Injectable()
export class IngestionService {
  constructor(private readonly client: PythonBackendHttpClient) {}

  trigger(request: IngestionRequest): Promise<IngestionResponse> {
    return this.client.request<IngestionResponse>('post', '/api/ingest', request);
  }

  status(jobId: number): Promise<{ status: string; [key: string]: any }> {
    return this.client.request('get', `/api/ingest/${jobId}/status`);
  }

  cancel(jobId: number): Promise<{ success: boolean; [key: string]: any }> {
    return this.client.request('post', `/api/ingest/${jobId}/cancel`, {});
  }
}
