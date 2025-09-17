import { IsOptional, IsString } from 'class-validator';

export class SearchJobsDto {
  @IsString()
  keywords!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  remote_ok?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  max_jobs?: string;
}
