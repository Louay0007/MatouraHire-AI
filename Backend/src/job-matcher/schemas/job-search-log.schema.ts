import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type JobSearchLogDocument = HydratedDocument<JobSearchLog>;

@Schema({ timestamps: true })
export class JobSearchLog {
  @Prop()
  keywords: string;

  @Prop()
  location?: string;

  @Prop()
  region?: string;

  @Prop({ default: false })
  remote_ok: boolean;

  @Prop()
  currency?: string;

  @Prop()
  max_jobs: number;

  @Prop({ type: Number })
  total_found?: number;
}

export const JobSearchLogSchema = SchemaFactory.createForClass(JobSearchLog);
