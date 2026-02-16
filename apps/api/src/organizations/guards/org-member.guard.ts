import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole } from '../../../generated/prisma/client';
import { OrganizationsService } from '../organizations.service';
import { ORG_ROLES_KEY } from '../decorators/org-roles.decorator';

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly orgsService: OrganizationsService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    const slug = request.params.slug;

    if (!user || !slug) {
      throw new ForbiddenException();
    }

    const org = await this.orgsService.findBySlug(slug);
    const membership = org.members.find((m) => m.userId === user.id);

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const requiredRoles = this.reflector.get<OrgRole[]>(
      ORG_ROLES_KEY,
      ctx.getHandler(),
    );

    if (
      requiredRoles &&
      requiredRoles.length > 0 &&
      !requiredRoles.includes(membership.role)
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    request.org = org;
    request.membership = membership;

    return true;
  }
}
