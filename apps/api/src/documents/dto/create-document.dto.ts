import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({
    example: 'Getting Started Guide',
    description: 'Document title',
    minLength: 2,
    maxLength: 200,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: 'This guide walks you through the initial setup process.',
    description: 'Document content (plain text or markdown)',
  })
  @IsString()
  @MinLength(1)
  content!: string;
}
