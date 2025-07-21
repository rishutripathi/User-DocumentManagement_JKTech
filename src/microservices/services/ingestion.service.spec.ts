import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PythonBackendHttpClient } from './python-backend.http-client.service';
import { IngestionRequest, IngestionResponse } from '../interface/python-backend.interface';


describe('IngestionService', () => {
  let service: IngestionService;
  let client: { request: jest.Mock };

  beforeEach(async () => {
    client = { request: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PythonBackendHttpClient, useValue: client },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  describe('trigger()', () => {
    const req: IngestionRequest = {
        jobId: 1,
        documentId: 0,
        filePath: '',
        fileName: '',
        mimeType: '',
        callbackUrl: ''
    };

    it('should call client.request with POST /api/ingest and return its data', async () => {
      const mockRes: IngestionResponse = {
          jobId: 1, status: 'queued',
          message: ''
      };
      client.request.mockResolvedValue(mockRes);

      await expect(service.trigger(req)).resolves.toEqual(mockRes);
      expect(client.request).toHaveBeenCalledWith(
        'post',
        '/api/ingest',
        req,
      );
    });

    it('should propagate errors from client.request', async () => {
      const err = new Error('network error');
      client.request.mockRejectedValue(err);

      await expect(service.trigger(req)).rejects.toThrow('network error');
    });
  });

  describe('status()', () => {
    const jobId = 42;
    const statusPayload = { status: 'running', progress: 50 };

    it('should call client.request with GET /api/ingest/:jobId/status and return its data', async () => {
      client.request.mockResolvedValue(statusPayload);

      await expect(service.status(jobId)).resolves.toEqual(statusPayload);
      expect(client.request).toHaveBeenCalledWith(
        'get',
        `/api/ingest/${jobId}/status`,
      );
    });

    it('should propagate errors from client.request', async () => {
      const err = new Error('timeout');
      client.request.mockRejectedValue(err);

      await expect(service.status(jobId)).rejects.toThrow('timeout');
    });
  });

  describe('cancel()', () => {
    const jobId = 99;
    const cancelPayload = { success: true, cancelledAt: '2025-07-14T00:00:00Z' };

    it('should call client.request with POST /api/ingest/:jobId/cancel and return its data', async () => {
      client.request.mockResolvedValue(cancelPayload);

      await expect(service.cancel(jobId)).resolves.toEqual(cancelPayload);
      expect(client.request).toHaveBeenCalledWith(
        'post',
        `/api/ingest/${jobId}/cancel`,
        {},
      );
    });

    it('should propagate errors from client.request', async () => {
      const err = new Error('server error');
      client.request.mockRejectedValue(err);

      await expect(service.cancel(jobId)).rejects.toThrow('server error');
    });
  });
});