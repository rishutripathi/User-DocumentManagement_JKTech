import { of, throwError } from 'rxjs';
import { AxiosResponse } from 'axios';
import { HttpService } from '@nestjs/axios';
import { PythonBackendService } from './python-backend.service';


describe('cancelIngestion', () => {
  let httpService: jest.Mocked<HttpService>;
  let service: PythonBackendService;

  beforeEach(() => {
    httpService = { get: jest.fn(), post: jest.fn() } as any;
    const configService = { get: jest.fn((k, d) => d) } as any;
    service = new PythonBackendService(httpService, configService);
  });

  it('posts to /api/ingest/:jobId/cancel and returns data', async () => {
    const cancelResp = { jobId: 3, status: 'cancelled', message: 'ok' };
    const fakeAxiosRes: AxiosResponse<typeof cancelResp> = {
      data:       cancelResp,
      status:     200,
      statusText: 'OK',
      headers:    {},
      config:     {} as any
    };
    httpService.post.mockReturnValueOnce(of(fakeAxiosRes));

    const result = await service.cancelIngestion(3);

    expect(result).toEqual(cancelResp);
    expect(httpService.post).toHaveBeenCalledWith(
      `${service['config'].baseUrl}/api/ingest/3/cancel`,
      {},
      {
        timeout: service['config'].timeout,
        headers: { 'X-API-Key': '' },
      },
    );
  });

  it('throws when the HTTP call errors', async () => {
    httpService.post.mockReturnValueOnce(throwError(() => new Error('cancel fail')));
    await expect(service.cancelIngestion(3)).rejects.toThrow('cancel fail');
  });
});
