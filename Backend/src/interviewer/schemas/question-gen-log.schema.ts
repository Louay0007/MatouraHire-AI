import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type QuestionGenLogDocument = HydratedDocument<QuestionGenLog>;

@Schema({ timestamps: true })
export class QuestionGenLog {
  @Prop()
  job_description?: string;

  @Prop()
  interview_type?: string;

  @Prop()
  num_questions?: number;

  @Prop({ type: Number })
  total_questions?: number;
}

export const QuestionGenLogSchema = SchemaFactory.createForClass(QuestionGenLog);
