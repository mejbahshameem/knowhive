import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../../generated/prisma/client';

export class AddMemberDto {
  @ApiProperty({
    example: 'member@example.com',
    description: 'Email of the user to add',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    enum: OrgRole,
    example: 'MEMBER',
    description: 'Role to assign (OWNER, ADMIN, or MEMBER)',
  })
  @IsEnum(OrgRole)
  role!: OrgRole;
}
