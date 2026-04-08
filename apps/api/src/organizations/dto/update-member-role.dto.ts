import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '../../../generated/prisma/client';

export class UpdateMemberRoleDto {
  @ApiProperty({
    enum: OrgRole,
    example: 'ADMIN',
    description: 'New role to assign (ADMIN or MEMBER)',
  })
  @IsEnum(OrgRole)
  role!: OrgRole;
}
