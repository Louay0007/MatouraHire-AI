import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProfileGenLogDocument = HydratedDocument<ProfileGenLog>;

@Schema({ timestamps: true })
export class ProfileGenLog {
  @Prop({ type: Number })
  responses_count?: number;

  @Prop({ type: Object })
  summary?: Record<string, any>;
}

export const ProfileGenLogSchema = SchemaFactory.createForClass(ProfileGenLog);
