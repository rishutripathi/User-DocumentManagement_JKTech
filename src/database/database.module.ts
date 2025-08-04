import { Global, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './service/database.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Dialect } from 'sequelize';


@Module({
  imports: [
    SequelizeModule.forRootAsync({
      inject: [ ConfigService ],
      useFactory: (configService: ConfigService) => (
        {
        dialect: configService.get<Dialect>('DATABASE_DIALECT'),
        host: configService.get<string>('PGHOST'),
        port: configService.get<number>('PGPORT'),
        username: configService.get('PGUSER'),
        password: configService.get('PGPASSWORD'),
        database: configService.get('PGDATABASE'),
        pool: {
          max: 10,       // maximum number of connections in pool
          min: 0,        // minimum number of connections in pool
          acquire: 30000, // maximum time (ms) pool will try to get connection before throwing error
          idle: 10000   // maximum time (ms) a connection can be idle before being released
        },
        autoLoadModels: true,
        retryAttempts: 3,
        logging: configService.get('NODE_ENV') == 'development' && console.log
      })
    })
  ],
  providers: [
    DatabaseService
  ],
  exports: [ DatabaseService ]
})


export class DatabaseModule {
  onModuleInit() {
  }

  onModuleDestroy() {}
}
