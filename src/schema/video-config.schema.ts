import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';
import { Streamer } from './streamer.schema';

@Schema()
export class VideoConfig extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
  })
  backgroundColor: string;

  @Prop({
    required: true,
    type: String,
  })
  mainColor: string;

  @Prop({
    required: true,
    type: String,
  })
  secondColor: string;

  @Prop({
    required: true,
    type: String,
  })
  font: string;

  @Prop({
    required: true,
    type: String,
  })
  textSize: string;

  @Prop({
    required: true,
    type: String,
  })
  effect: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
  })
  streamer: Streamer;
}

export type VideoConfigDocument = HydratedDocument<VideoConfig>;
export const VideoConfigSchema = SchemaFactory.createForClass(VideoConfig);
