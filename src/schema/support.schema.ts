import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';
import { Token } from './token.schema';

@Schema()
export class Support extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
    index: true,
  })
  from: string;

  @Prop({
    required: true,
    type: Number,
  })
  amount: number;

  @Prop({
    required: true,
    type: String,
  })
  message: string;

  @Prop({
    required: true,
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Token',
  })
  token: Token;

  @Prop({
    required: true,
    type: String,
  })
  hash: string;
}

export type SupportDocument = HydratedDocument<Support>;
export const SupportSchema = SchemaFactory.createForClass(Support);
