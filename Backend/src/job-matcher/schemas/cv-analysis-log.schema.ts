import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CVAnalysisLogDocument = HydratedDocument<CVAnalysisLog>;

@Schema({ timestamps: true })
export class CVAnalysisLog {
  @Prop({ type: String })
  resumeHash?: string;

  @Prop({ type: Number })
  skillsCount?: number;

  @Prop({ type: Number })
  experience_years?: number;

  @Prop({ type: [String] })
  skills?: string[];

  @Prop({ type: String })
  job_keywords?: string;
}

export const CVAnalysisLogSchema = SchemaFactory.createForClass(CVAnalysisLog);
