import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';
import { TokenService } from './token.service';
import { UserRole } from 'src/common/enums/database.enums';


jest.mock('uuid');

describe('TokenService', () => {
  let service: TokenService;
  let jwtService: JwtService;

  const mockUuidv4 = uuidv4 as jest.Mock;

  const mockUser: any = {
    id: 123,
    email: 'test@example.com',
    role: UserRole.ADMIN,
    password: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokenId', () => {
    it('should generate a unique token ID using uuidv4', () => {
      const fakeUuid = 'a-unique-uuid-string';
      mockUuidv4.mockReturnValue(fakeUuid);

      const tokenId = service.generateTokenId();

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(tokenId).toBe(fakeUuid);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT with the correct payload', () => {
      const fakeTokenId = 'fake-token-id-abc';
      const signedToken = 'signed.jwt.token';

      jest.spyOn(service, 'generateTokenId').mockReturnValue(fakeTokenId);
      
      mockJwtService.sign.mockReturnValue(signedToken);

      const result = service.generateToken(mockUser);

      const expectedPayload = {
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        tokenId: fakeTokenId,
      };

      expect(jwtService.sign).toHaveBeenCalledWith(expectedPayload);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      
      expect(result).toBe(signedToken);
    });

    it('should call generateTokenId when creating a token', () => {
        const generateTokenIdSpy = jest.spyOn(service, 'generateTokenId');
  
        service.generateToken(mockUser);
  
        expect(generateTokenIdSpy).toHaveBeenCalledTimes(1);
    });
  });
});
