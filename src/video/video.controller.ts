import { Controller, Get, HttpStatus } from '@nestjs/common';
import { VideoService } from './video.service';

@Controller('videos')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Get()
  async list(): Promise<any> {
    const videos = await this.videoService.getVideos();

    return {
      success: true,
      message: 'Streamer fetched successfully',
      statusCode: HttpStatus.OK,
      data: videos,
    };
  }
}
