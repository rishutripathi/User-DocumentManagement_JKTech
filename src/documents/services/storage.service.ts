import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';


@Injectable()
export class StorageService {
  delete(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      throw new InternalServerErrorException(`Failed to delete file at ${filePath}`);
    }
  }
}
