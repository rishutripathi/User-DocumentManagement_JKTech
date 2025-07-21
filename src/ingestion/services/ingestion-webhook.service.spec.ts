import { BadRequestException } from '@nestjs/common';
import { IngestionWebhookService } from './ingestion-webhook.service';
import { IngestionCommandService } from './ingestion-command.service';
import { WebhookDto } from '../DTO/ingestion-webhook.dto';


describe('IngestionWebhookService', () => {
  let service: IngestionWebhookService;
  let commands: jest.Mocked<IngestionCommandService>;

  beforeEach(() => {
    commands = {
      updateStatus: jest.fn(),   // returns void
    } as unknown as jest.Mocked<IngestionCommandService>;

    service = new IngestionWebhookService(commands);
  });

  it('throws BadRequestException if jobId is missing or falsy', async () => {
    await expect(service.handle({} as any)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.handle({ jobId: 0 } as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('calls updateStatus with the right arguments and resolves to undefined', async () => {
    const payload = {
      jobId: 123,
      status: 'completed',
      progress: 85,
    } as WebhookDto;

    commands.updateStatus.mockResolvedValueOnce(undefined);

    await expect(service.handle(payload)).resolves.toBeUndefined();
    expect(commands.updateStatus).toHaveBeenCalledWith(123, {
      status:       payload.status,
      progress:     payload.progress,
      errorMessage: undefined,
      resultData:   undefined,
    });
  });

  it('propagates errors from updateStatus', async () => {
    const payload = { jobId: 5, status: 'failed', progress: 10 } as WebhookDto;
    const error = new Error('upstream failure');
    commands.updateStatus.mockRejectedValueOnce(error);

    await expect(service.handle(payload)).rejects.toThrow('upstream failure');
    expect(commands.updateStatus).toHaveBeenCalledWith(5, expect.any(Object));
  });
});
