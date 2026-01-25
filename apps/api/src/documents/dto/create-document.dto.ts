import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title!: string;

  @IsString()
  @MinLength(1)
  content!: string;
}
