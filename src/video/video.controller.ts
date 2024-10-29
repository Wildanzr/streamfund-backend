import { Controller, Get } from '@nestjs/common';
import { Video } from 'src/schema/video.schema';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  async list(): Promise<Video[]> {
    return [];
  }
}
