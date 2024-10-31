import { Module } from '@nestjs/common';
import { NotifyGateway } from './notify.gateway';
import { NotifyService } from './notify.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Streamer, StreamerSchema } from 'src/schema/streamer.schema';
import { Support, SupportSchema } from 'src/schema/support.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';
import { ContractsService } from 'src/contracts/contracts.service';
import { StreamService } from 'src/stream/stream.service';
import { QRConfig, QRConfigSchema } from 'src/schema/qr-config.schema';
import { MQConfig, MQConfigSchema } from 'src/schema/mq-config.schema';
import { AlertConfig, AlertConfigSchema } from 'src/schema/alert-config.schema';
import { SupportNotificationQueue } from './support-notification-queue';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Streamer.name, schema: StreamerSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Token.name, schema: TokenSchema },
      { name: QRConfig.name, schema: QRConfigSchema },
      { name: MQConfig.name, schema: MQConfigSchema },
      { name: AlertConfig.name, schema: AlertConfigSchema },
    ]),
  ],
  providers: [
    NotifyGateway,
    NotifyService,
    ContractsService,
    StreamService,
    SupportNotificationQueue,
    {
      provide: 'UNDEFINED',
      useValue: undefined,
    },
  ],
  exports: [NotifyGateway, SupportNotificationQueue],
})
export class NotifyModule { }
