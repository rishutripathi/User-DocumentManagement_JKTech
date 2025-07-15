import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/sequelize';
import { Document } from 'src/documents/models/document.model';
import { User } from 'src/user/models/user.model';
import { IngestionJob } from 'src/ingestion/models/ingestion_jobs.model';
import { DocumentPermission } from 'src/documents/models/document_permissions.model';


@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {

  public readonly logger = new Logger(DatabaseService.name)

  constructor(
    @Inject(getConnectionToken()) 
    private readonly sequelize: Sequelize,
    public readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      const databaseUrl = this.configService.get<string>('DATABASE_URL');      
      if (!databaseUrl) {
        throw new Error(
          'DATABASE_URL must be set. Did you forget to provision a database?'
        );
      }
      await this.sequelize.authenticate();
      this.logger.log('Database connection established successfully');
      this.initAssociations();
    } catch (error) {
      this.logger.error(`Failed to connect to database: ${error?.message}`);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.sequelize.close();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error(`Failed to Database connection closed: ${error?.message}`);
    }
  }

  private initAssociations() {
    /*
      Associations
    */

    Document.belongsTo(User, {
      foreignKey: 'id',
      as: 'uploadedBy'
    });

    Document.hasMany(IngestionJob, {
      foreignKey: 'documentId',
      as: 'ingestionJobs'
    });

    Document.hasMany(DocumentPermission, {
      foreignKey: 'documentId',
      as: 'permissions'
    });

    DocumentPermission.belongsTo(Document, {
      foreignKey: 'documentId',
      as: 'document',
    });

    DocumentPermission.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
    });

    DocumentPermission.belongsTo(User, {
      foreignKey: 'grantedById',
      as: 'grantedBy',
    });
    
    User.hasMany(DocumentPermission, {
      foreignKey: 'userId',
      as: 'documentPermissions',
    });
    
    User.hasMany(DocumentPermission, {
      foreignKey: 'granted_by_id',
      as: 'grantedPermissions',
    });
  }
}

