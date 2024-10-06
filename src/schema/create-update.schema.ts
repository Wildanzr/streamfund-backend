import { Prop } from '@nestjs/mongoose';

export class CreateUpdate {
  @Prop({
    required: false,
    type: Date,
    default: () => Date.now(),
  })
  creted_at: Date;

  @Prop({
    required: false,
    type: Date,
    default: () => Date.now(),
  })
  updated_at: Date;
}
