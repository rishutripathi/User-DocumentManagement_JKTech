import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  const MOCK_DATE = new Date('2023-01-01T00:00:00.000Z');

  beforeAll(() => {
    // Use fake timers to control Date object
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);
  });

  afterAll(() => {
    // Restore real timers
    jest.useRealTimers();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SessionService],
    }).compile();

    service = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session for a given token ID', async () => {
      const tokenId = 'test-token-id-123';
      
      const sessionsMap = (service as any).sessions as Map<string, { expiresAt: Date }>;

      expect(sessionsMap.has(tokenId)).toBe(false);

      await service.createSession(tokenId);

      expect(sessionsMap.has(tokenId)).toBe(true);
    });

    it('should set the session to expire in 24 hours', async () => {
      const tokenId = 'test-token-id-456';
      await service.createSession(tokenId);

      const sessionsMap = (service as any).sessions as Map<string, { expiresAt: Date }>;
      const session = sessionsMap.get(tokenId);

      const expectedExpiry = new Date(MOCK_DATE);
      expectedExpiry.setHours(expectedExpiry.getHours() + 24);

      expect(session).toBeDefined();
      expect(session?.expiresAt).toEqual(expectedExpiry);
    });
  });

  describe('invalidateSession', () => {
    it('should remove an existing session', async () => {
      const tokenId = 'test-token-to-invalidate';
      const sessionsMap = (service as any).sessions as Map<string, { expiresAt: Date }>;
      
      // First, create the session to ensure it exists
      await service.createSession(tokenId);
      expect(sessionsMap.has(tokenId)).toBe(true);

      // Now, invalidate it
      await service.invalidateSession(tokenId);
      expect(sessionsMap.has(tokenId)).toBe(false);
    });

    it('should not throw an error if the session to invalidate does not exist', async () => {
      const tokenId = 'non-existent-token';
      const sessionsMap = (service as any).sessions as Map<string, { expiresAt: Date }>;

      expect(sessionsMap.has(tokenId)).toBe(false);
      
      await expect(service.invalidateSession(tokenId)).resolves.not.toThrow();
    });
  });
});
