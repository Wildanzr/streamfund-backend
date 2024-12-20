import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { NotifyModule } from './notify/notify.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractsModule } from './contracts/contracts.module';
import { StreamModule } from './stream/stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/',
      {
        appName: 'streamfund',
        dbName: 'streamfund-v1',
      },
    ),
    NotifyModule,
    ContractsModule,
    StreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
