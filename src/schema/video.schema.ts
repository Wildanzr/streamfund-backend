import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';

@Schema()
export class Video extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
    unique: true,
    index: true,
  })
  video_id: string;

  @Prop({
    required: true,
    type: String,
  })
  link: string;

  @Prop({
    required: true,
    type: String,
  })
  thumbnail: string;

  @Prop({
    required: true,
    type: Number,
  })
  price: number;
}

export type VideoDocument = HydratedDocument<Video>;
export const VideoSchema = SchemaFactory.createForClass(Video);
