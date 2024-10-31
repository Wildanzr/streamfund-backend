import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QRConfig, QRConfigSchema } from 'src/schema/qr-config.schema';
import { ContractsService } from 'src/contracts/contracts.service';
import { Streamer, StreamerSchema } from 'src/schema/streamer.schema';
import { Support, SupportSchema } from 'src/schema/support.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';
import { MQConfig, MQConfigSchema } from 'src/schema/mq-config.schema';
import { AlertConfig, AlertConfigSchema } from 'src/schema/alert-config.schema';
import { NotifyModule } from 'src/notify/notify.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QRConfig.name, schema: QRConfigSchema },
      { name: MQConfig.name, schema: MQConfigSchema },
      { name: Streamer.name, schema: StreamerSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Token.name, schema: TokenSchema },
      { name: AlertConfig.name, schema: AlertConfigSchema },
    ]),
    NotifyModule,
  ],
  controllers: [StreamController],
  providers: [StreamService, ContractsService],
})
export class StreamModule { }
