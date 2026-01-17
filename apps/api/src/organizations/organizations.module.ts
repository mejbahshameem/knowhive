import { Module } from '@nestjs/common';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { OrgMemberGuard } from './guards/org-member.guard';

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService, OrgMemberGuard],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
