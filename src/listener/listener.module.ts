import { Module } from '@nestjs/common';
import { ListenerService } from './listener.service';
import { QueuemanagerModule } from 'src/queuemanager/queuemanager.module';

@Module({
  providers: [ListenerService],
  imports: [QueuemanagerModule],
})
export class ListenerModule {}
