import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CreateUpdate } from './create-update.schema';

@Schema()
export class Token extends CreateUpdate {
  @Prop({
    required: true,
    type: String,
    unique: true,
    index: true,
  })
  address: string;

  @Prop({
    required: true,
    type: String,
    unique: false,
  })
  feed: string;

  @Prop({
    required: true,
    type: Number,
  })
  decimal: number;

  @Prop({
    required: true,
    type: String,
  })
  symbol: string;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  logo: string;
}

export type TokenDocument = HydratedDocument<Token>;
export const TokenSchema = SchemaFactory.createForClass(Token);
