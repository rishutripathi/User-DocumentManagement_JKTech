import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MulterModule } from '@nestjs/platform-express';
import { ThrottlerModule } from '@nestjs/throttler';
import { diskStorage } from 'multer';
import { extname } from 'path';
import helmet from 'helmet';
import * as csurf from 'csurf';
import * as cookieParser from 'cookie-parser';

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

    // Rate limiting for DDoS protection
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60,
        limit: 100
      }
    ]),

    // Database
    DatabaseModule,

    // Authentication
    PassportModule,
    JwtModule.registerAsync(jwtConfig),

    // File upload configuration with security enhancements
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
        files: 5, // Maximum 5 files
      },
      fileFilter: (req, file, cb) => {
        // Whitelist allowed file types
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/pdf',
          'text/plain',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type'), false);
        }
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(cookieParser())
      .forRoutes('*');

    // Helmet middleware for security headers
    consumer
      .apply(helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            manifestSrc: ["'self'"],
          },
        },
        crossOriginEmbedderPolicy: false,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        },
        noSniff: true,
        frameguard: { action: 'deny' },
        xssFilter: true,
        referrerPolicy: { policy: 'same-origin' }
      }))
      .forRoutes('*');

    // CSRF protection middleware
    consumer
      .apply(csurf({
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production', // secure cookies in production
          sameSite: 'strict',
          maxAge: 3600000, // 1 hour
        },
        ignoredMethods: ['HEAD', 'OPTIONS'],
        skip: (req: { path: string; headers: { [x: string]: string; }; }) => {
          return req.path.startsWith('/api/auth/') || 
                 req.path.startsWith('/api/public/') ||
                 req.headers['authorization']?.startsWith('Bearer ');
        }
      }))
      .forRoutes('*');
  }
}