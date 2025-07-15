import { Injectable, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { AxiosRequestConfig } from 'axios';
import { firstValueFrom } from 'rxjs';
import { retry } from 'rxjs/operators';
import { PythonBackendConfig } from '../interface/python-backend.interface';

@Injectable()
export class PythonBackendHttpClient {
  private readonly logger = new Logger(PythonBackendHttpClient.name);

  constructor(
    private readonly http: HttpService,
    @Inject('PYTHON_BACKEND_CONFIG')
    private readonly cfg: PythonBackendConfig,
  ) {}

  private buildUrl(path: string): string {
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${this.cfg.baseUrl}${p}`;
  }

  async request<T>(
    method: 'get' | 'post',
    path: string,
    data?: any,
  ): Promise<T> {
    const url = this.buildUrl(path);
    const axiosConfig: AxiosRequestConfig = {
      timeout: this.cfg.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.cfg.apiKey,
      },
    };

    try {
      const call$ =
        method === 'get'
          ? this.http.get<T>(url, axiosConfig)
          : this.http.post<T>(url, data, axiosConfig);

      const response = await firstValueFrom(
        call$.pipe(retry(this.cfg.retryAttempts)),
      );
      return response.data;
    } catch (err: any) {
      this.logger.error(
        `HTTP ${method.toUpperCase()} ${url} failed`,
        err.stack ?? err.message,
      );
      throw err;
    }
  }
}
