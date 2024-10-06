import { Module } from '@nestjs/common';
import { QueuemanagerService } from './queuemanager.service';
import { NotifyModule } from 'src/notify/notify.module';

@Module({
  providers: [QueuemanagerService],
  exports: [QueuemanagerService],
  imports: [NotifyModule],
})
export class QueuemanagerModule {}
