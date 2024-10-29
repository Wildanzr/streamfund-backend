import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Video } from 'src/schema/video.schema';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name)
    private readonly videoModel = Model<Video>,
  ) {}

  async getVideos(): Promise<Video[]> {
    return await this.videoModel.find();
  }
}
