import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '../../../generated/prisma/client';

export class AddMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(OrgRole)
  role!: OrgRole;
}
