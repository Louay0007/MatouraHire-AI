import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResponseAnalysisLogDocument = HydratedDocument<ResponseAnalysisLog>;

@Schema({ timestamps: true })
export class ResponseAnalysisLog {
  @Prop()
  question?: string;

  @Prop()
  response?: string;

  @Prop()
  question_type?: string;
}

export const ResponseAnalysisLogSchema = SchemaFactory.createForClass(ResponseAnalysisLog);
