import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FootprintLogDocument = HydratedDocument<FootprintLog>;

@Schema({ timestamps: true })
export class FootprintLog {
  @Prop()
  provider!: 'github' | 'linkedin' | 'stackoverflow';

  @Prop()
  identifier?: string; // username, profile URL, or user_id

  @Prop({ type: Number })
  responseSize?: number;
}

export const FootprintLogSchema = SchemaFactory.createForClass(FootprintLog);
