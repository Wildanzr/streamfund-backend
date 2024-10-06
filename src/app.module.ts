import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { NotifyModule } from './notify/notify.module';
import { ListenerModule } from './listener/listener.module';
import { QueuemanagerModule } from './queuemanager/queuemanager.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    NotifyModule,
    ListenerModule,
    QueuemanagerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
