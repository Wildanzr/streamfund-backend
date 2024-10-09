import { Module } from '@nestjs/common';
import { StreamService } from './stream.service';
import { StreamController } from './stream.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { QRConfig, QRConfigSchema } from 'src/schema/qr-config.schema';
import { ContractsService } from 'src/contracts/contracts.service';
import { Streamer, StreamerSchema } from 'src/schema/streamer.schema';
import { Support, SupportSchema } from 'src/schema/support.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QRConfig.name, schema: QRConfigSchema },
      { name: Streamer.name, schema: StreamerSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  controllers: [StreamController],
  providers: [StreamService, ContractsService],
})
export class StreamModule {}
