import { Module } from '@nestjs/common';
import { NotifyGateway } from './notify.gateway';
import { NotifyService } from './notify.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Streamer, StreamerSchema } from 'src/schema/streamer.schema';
import { Support, SupportSchema } from 'src/schema/support.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Streamer.name, schema: StreamerSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
  ],
  providers: [NotifyGateway, NotifyService],
  exports: [NotifyGateway],
})
export class NotifyModule {}
