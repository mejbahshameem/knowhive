import { IsString, MinLength, IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchDto {
  @ApiProperty({
    example: 'How do I deploy to production?',
    description: 'Natural language search query',
  })
  @IsString()
  @MinLength(1)
  query!: string;

  @ApiPropertyOptional({
    example: 5,
    description: 'Maximum number of results to return',
    minimum: 1,
    default: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
