import { Injectable } from '@nestjs/common';
import { PythonBackendHttpClient } from './python-backend.http-client.service';


@Injectable()
export class StatsService {
  constructor(private readonly client: PythonBackendHttpClient) {}

  healthCheck(): Promise<boolean> {
    return this.client
      .request<{ status: string }>('get', '/health')
      .then(res => res.status === 'ok');
  }

  getSystemStats(): Promise<Record<string, any>> {
    return this.client.request('get', '/api/stats');
  }
}
