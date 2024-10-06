import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { NotifyGateway } from './notify/notify.gateway';
import { NotifyService } from './notify/notify.service';
import { NotifyModule } from './notify/notify.module';
import { ListenerService } from './listener/listener.service';
import { ListenerModule } from './listener/listener.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    NotifyModule,
    ListenerModule,
  ],
  controllers: [AppController],
  providers: [AppService, NotifyGateway, NotifyService, ListenerService],
})
export class AppModule {}
