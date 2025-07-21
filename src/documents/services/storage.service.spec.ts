import { InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should do nothing if file does not exist', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    
    expect(() => service.delete('/some/path')).not.toThrow();
    expect(unlinkSpy).not.toHaveBeenCalled();
  });

  it('should delete the file when it exists', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    
    expect(() => service.delete('/some/path')).not.toThrow();
    expect(unlinkSpy).toHaveBeenCalledWith('/some/path');
  });

  it('should throw InternalServerErrorException if unlinkSync throws', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {
      throw new Error('disk full');
    });

    expect(() => service.delete('/some/path'))
      .toThrow(InternalServerErrorException);

    try {
      service.delete('/some/path');
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect(err.message).toBe('Failed to delete file at /some/path');
    }
  });

  it('should throw InternalServerErrorException if existsSync throws', () => {
    jest.spyOn(fs, 'existsSync').mockImplementation(() => {
      throw new Error('permission denied');
    });

    expect(() => service.delete('/some/path'))
      .toThrow(InternalServerErrorException);

    try {
      service.delete('/some/path');
    } catch (err) {
      expect(err).toBeInstanceOf(InternalServerErrorException);
      expect(err.message).toBe('Failed to delete file at /some/path');
    }
  });
});
