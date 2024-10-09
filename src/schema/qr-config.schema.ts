import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';
import { Streamer } from './streamer.schema';

@Schema()
export class QRConfig extends CreateUpdate {
  @Prop({
    required: true,
    type: Number,
  })
  quietZone: number;

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  bgColor: string;

  @Prop({
    required: true,
    type: String,
  })
  fgColor: string;

  @Prop({
    required: true,
    type: String,
  })
  level: string;

  @Prop({
    required: true,
    type: String,
  })
  style: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
  })
  streamer: Streamer;
}

export type QRConfigDocument = HydratedDocument<QRConfig>;
export const QRConfigSchema = SchemaFactory.createForClass(QRConfig);
