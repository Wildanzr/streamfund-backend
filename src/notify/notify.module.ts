import { Module } from '@nestjs/common';
import { NotifyGateway } from './notify.gateway';
import { NotifyService } from './notify.service';

@Module({
  providers: [NotifyGateway, NotifyService],
  exports: [NotifyGateway],
})
export class NotifyModule {}
