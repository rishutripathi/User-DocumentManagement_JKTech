import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { IngestionStateMachineService } from './ingestion-state-machine.service';
import { IngestionStatus } from '../enum/ingestion.enum';
import { UpdateUserDto } from 'src/user/DTO/user.dtos';

describe('IngestionStateMachineService', () => {
  let service: IngestionStateMachineService;
  const FIXED_DATE = new Date('2025-07-14T12:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(FIXED_DATE);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    service = new IngestionStateMachineService();
  });

  describe('computeChanges()', () => {
    it('should always set only updatedAt when dto is empty', () => {
      const dto = {} as unknown as UpdateUserDto;
      const changes = service.computeChanges(dto);
      expect(changes).toEqual({ updatedAt: FIXED_DATE });
    });

    it('should include status and startedAt when status=PROCESSING', () => {
      const dto = { status: IngestionStatus.PROCESSING } as unknown as UpdateUserDto;
      const changes = service.computeChanges(dto);
      expect(changes).toEqual({
        updatedAt: FIXED_DATE,
        status: IngestionStatus.PROCESSING,
        startedAt: FIXED_DATE,
      });
    });

    it('should include progress, errorMessage, resultData when provided', () => {
      const dto = {
        progress: 42.5,
        errorMessage: 'oops',
        resultData: { foo: 'bar' },
      } as unknown as UpdateUserDto;

      const changes = service.computeChanges(dto);
      expect(changes).toEqual({
        updatedAt: FIXED_DATE,
        progress: 42.5,
        errorMessage: 'oops',
        resultData: { foo: 'bar' },
      });
    });
  });

  describe('ensureCanCancel()', () => {
    const baseJob = {
      triggeredById: 123,
      status: IngestionStatus.QUEUED,
      retryCount: 0,
      maxRetries: 3,
    } as any;

    it('throws NotFoundException if job is null/undefined', () => {
      expect(() =>
        service.ensureCanCancel(null as any, { id: 1, role: 'admin' } as any),
      ).toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-admin, non-owner', () => {
      const user = { id: 999, role: 'user' } as any;
      expect(() =>
        service.ensureCanCancel(baseJob, user),
      ).toThrow(ForbiddenException);
    });

    for (const badStatus of [
      IngestionStatus.COMPLETED,
      IngestionStatus.FAILED,
      IngestionStatus.CANCELLED,
    ]) {
      it(`throws BadRequestException when status is ${badStatus}`, () => {
        const job = { ...baseJob, status: badStatus } as any;
        const user = { id: baseJob.triggeredById, role: 'user' } as any;
        expect(() =>
          service.ensureCanCancel(job, user),
        ).toThrow(BadRequestException);
      });
    }

    it('allows cancel for owner when status is QUEUED', () => {
      const job = { ...baseJob, status: IngestionStatus.QUEUED } as any;
      const user = { id: baseJob.triggeredById, role: 'user' } as any;
      expect(service.ensureCanCancel(job, user)).toBe(job);
    });

    it('allows cancel for admin when status is PROCESSING', () => {
      const job = { ...baseJob, status: IngestionStatus.PROCESSING } as any;
      const user = { id: 999, role: 'admin' } as any;
      expect(service.ensureCanCancel(job, user)).toBe(job);
    });
  });

  describe('ensureCanRetry()', () => {
    const baseJob = {
      triggeredById: 456,
      status: IngestionStatus.FAILED,
      retryCount: 1,
      maxRetries: 3,
    } as any;

    it('throws NotFoundException if job is null/undefined', () => {
      expect(() =>
        service.ensureCanRetry(null as any, { id: 1, role: 'admin' } as any),
      ).toThrow(NotFoundException);
    });

    it('throws ForbiddenException when non-admin, non-owner', () => {
      const user = { id: 999, role: 'user' } as any;
      expect(() =>
        service.ensureCanRetry(baseJob, user),
      ).toThrow(ForbiddenException);
    });

    it('throws BadRequestException if status is not FAILED', () => {
      const job = { ...baseJob, status: IngestionStatus.COMPLETED } as any;
      const user = { id: baseJob.triggeredById, role: 'user' } as any;
      expect(() =>
        service.ensureCanRetry(job, user),
      ).toThrow(BadRequestException);
    });

    it('throws BadRequestException if retryCount >= maxRetries', () => {
      const job = { ...baseJob, retryCount: 3, maxRetries: 3 } as any;
      const user = { id: baseJob.triggeredById, role: 'user' } as any;
      expect(() =>
        service.ensureCanRetry(job, user),
      ).toThrow(BadRequestException);
    });

    it('allows retry for owner when status is FAILED and retryCount < maxRetries', () => {
      const job = { ...baseJob, retryCount: 2, maxRetries: 3 } as any;
      const user = { id: baseJob.triggeredById, role: 'user' } as any;
      expect(service.ensureCanRetry(job, user)).toBe(job);
    });

    it('allows retry for admin when status is FAILED and under maxRetries', () => {
      const job = { ...baseJob, retryCount: 2, maxRetries: 3 } as any;
      const user = { id: 999, role: 'admin' } as any;
      expect(service.ensureCanRetry(job, user)).toBe(job);
    });
  });
});
