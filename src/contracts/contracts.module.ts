import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Streamer, StreamerSchema } from 'src/schema/streamer.schema';
import { Support, SupportSchema } from 'src/schema/support.schema';
import { Token, TokenSchema } from 'src/schema/token.schema';
import { Video, VideoSchema } from 'src/schema/video.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Streamer.name, schema: StreamerSchema },
      { name: Support.name, schema: SupportSchema },
      { name: Token.name, schema: TokenSchema },
      { name: Video.name, schema: VideoSchema },
    ]),
  ],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
