import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { PythonBackendHttpClient } from './python-backend.http-client.service';
import { PythonBackendConfig } from '../interface/python-backend.interface';
import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';


describe('PythonBackendHttpClient', () => {
  let client: PythonBackendHttpClient;
  let httpService: HttpService;
  const config: PythonBackendConfig = {
    baseUrl: 'http://test-api',
    apiKey: 'test-key',
    timeout: 1234,
    retryAttempts: 2,
  };

  beforeEach(async () => {
    const httpMock = {
      get: jest.fn(),
      post: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonBackendHttpClient,
        { provide: HttpService, useValue: httpMock },
        { provide: 'PYTHON_BACKEND_CONFIG', useValue: config },
      ],
    }).compile();

    client = module.get(PythonBackendHttpClient);
    httpService = module.get(HttpService);
  });

  describe('buildUrl()', () => {
    it('should prepend a slash if missing', () => {
      // @ts-ignore private access
      expect(client.buildUrl('foo')).toBe('http://test-api/foo');
    });

    it('should not add double slash', () => {
      // @ts-ignore private access
      expect(client.buildUrl('/bar')).toBe('http://test-api/bar');
    });
  });

  describe('request()', () => {
    const fakeResponse: AxiosResponse<{ value: string }> = {
      data: { value: 'ok' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any
    };

    it('should perform GET and return response.data', async () => {
      (httpService.get as jest.Mock).mockReturnValue(of(fakeResponse));

      const result = await client.request<{ value: string }>('get', '/baz');
      expect(result).toEqual({ value: 'ok' });
      expect(httpService.get).toHaveBeenCalledWith(
        'http://test-api/baz',
        {
          timeout: 1234,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          },
        },
      );
    });

    it('should perform POST with data and return response.data', async () => {
      const payload = { foo: 'bar' };
      (httpService.post as jest.Mock).mockReturnValue(of(fakeResponse));

      const result = await client.request<{ value: string }>('post', 'qux', payload);
      expect(result).toEqual({ value: 'ok' });
      expect(httpService.post).toHaveBeenCalledWith(
        'http://test-api/qux',
        payload,
        {
          timeout: 1234,
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-key',
          },
        },
      );
    });

    it('should retry on transient errors and then succeed', async () => {
      const error = new Error('transient');
      // first call throws, second returns OK
      (httpService.get as jest.Mock)
        .mockReturnValueOnce(throwError(() => error))
        .mockReturnValueOnce(of(fakeResponse));

      const result = await client.request<{ value: string }>('get', '/retry');
      expect(result).toEqual({ value: 'ok' });
      expect(httpService.get).toHaveBeenCalledTimes(2);
    });

    it('should throw after retries are exhausted', async () => {
      const error = new Error('fatal');
      // always error
      (httpService.post as jest.Mock)
        .mockReturnValue(throwError(() => error));

      await expect(
        client.request('post', '/fail', { a: 1 })
      ).rejects.toThrow('fatal');
      // called retryAttempts + first attempt times
      expect(httpService.post).toHaveBeenCalledTimes(config.retryAttempts + 1);
    });
  });
});
