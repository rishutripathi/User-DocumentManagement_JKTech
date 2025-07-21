import { Test } from '@nestjs/testing';
import { UserDeleteService } from './user-delete.service';
import { NotFoundException } from '@nestjs/common';
import { User } from '../models/user.model';


describe('UserDeleter', () => {
  let service: UserDeleteService;
  let mockRepository: {
    findById: jest.Mock<Promise<User | null>, [number]>;
    destroy: jest.Mock<Promise<void>, [any]>;
    deleteAll: jest.Mock<Promise<void>, []>;
  };

  beforeEach(async () => {
    mockRepository = {
      findById: jest.fn(),
      destroy: jest.fn(),
      deleteAll: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        UserDeleteService,
        { provide: 'IUserRepository', useValue: mockRepository },
      ],
    }).compile();

    service = module.get<UserDeleteService>(UserDeleteService);
  });

  describe('deleteUser', () => {
    it('should delete the user and return success message when user exists', async () => {
      const mockUser = { id: 1 } as User;
      mockRepository.findById.mockResolvedValue(mockUser);
      mockRepository.destroy.mockResolvedValue(undefined);

      const result = await service.deleteUser(1);

      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.destroy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteUser(1)).rejects.toThrow(NotFoundException);
      expect(mockRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRepository.destroy).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllUsers', () => {
    it('should delete all users and return success message', async () => {
      mockRepository.deleteAll.mockResolvedValue(undefined);

      const result = await service.deleteAllUsers();

      expect(mockRepository.deleteAll).toHaveBeenCalled();
      expect(result).toEqual({ message: 'All users deleted successfully' });
    });
  });
});