import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';
import { Support } from './support.schema';

@Schema()
export class Streamer extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
    unique: true,
    index: true,
  })
  streamkey: string;

  @Prop({
    required: true,
    type: String,
    unique: true,
  })
  address: string;

  @Prop({
    required: true,
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Support' }],
  })
  supports: Support[];
}

export type StreamerDocument = HydratedDocument<Streamer>;
export const StreamerSchema = SchemaFactory.createForClass(Streamer);
