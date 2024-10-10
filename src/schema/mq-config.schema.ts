import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';
import { Streamer } from './streamer.schema';

@Schema()
export class MQConfig extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
  })
  backgroundColor: string;

  @Prop({
    required: true,
    type: String,
  })
  textColor: string;

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
  text: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Streamer',
  })
  streamer: Streamer;
}

export type MQConfigDocument = HydratedDocument<MQConfig>;
export const MQConfigSchema = SchemaFactory.createForClass(MQConfig);
