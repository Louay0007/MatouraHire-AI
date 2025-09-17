import { IsString, MinLength } from 'class-validator';

export class AnalyzeCvDto {
  @IsString()
  @MinLength(10)
  resume_text!: string;
}
