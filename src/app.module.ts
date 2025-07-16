import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DocumentsModule } from './documents/documents.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { jwtConfig } from './config/jwt.config';
import { SeedingModule } from './seeding/seeding.module';


@Module({
  imports: [

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`
    }),

    // Database
    DatabaseModule,

    // Authentication
    PassportModule,
    JwtModule.registerAsync(jwtConfig),

    // File upload configuration
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          cb(null, `${uniqueSuffix}-${file.fieldname}${extname(file.originalname)}`);
        },
      }),
      limits: {
        fileSize: 8 * 1024 * 1024, // 8MB limit
      },
    }),

    // Feature modules
    AuthModule,
    UserModule,
    DocumentsModule,
    IngestionModule,
    SeedingModule
  ],
  exports: [
    ConfigModule
  ]
})


export class AppModule {}
