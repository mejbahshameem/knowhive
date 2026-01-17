import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrgRole } from '../../generated/prisma/client';
import { CreateOrganizationDto, UpdateOrganizationDto, AddMemberDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto, userId: string) {
    const slug = await this.generateUniqueSlug(dto.name);

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug,
        members: {
          create: { userId, role: OrgRole.OWNER },
        },
      },
      include: {
        members: { include: { user: { select: { id: true, email: true, name: true } } } },
      },
    });

    return org;
  }

  async findAllByUser(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: { _count: { select: { members: true, knowledgeBases: true } } },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.organization,
      role: m.role,
      joinedAt: m.joinedAt,
    }));
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({
      where: { slug },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { knowledgeBases: true } },
      },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return org;
  }

  async update(slug: string, dto: UpdateOrganizationDto, userId: string) {
    const org = await this.findBySlug(slug);
    this.assertRole(org.members, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

    const data: Record<string, string> = {};
    if (dto.name) {
      data.name = dto.name;
      data.slug = await this.generateUniqueSlug(dto.name, org.id);
    }

    return this.prisma.organization.update({
      where: { id: org.id },
      data,
    });
  }

  async remove(slug: string, userId: string) {
    const org = await this.findBySlug(slug);
    this.assertRole(org.members, userId, [OrgRole.OWNER]);

    await this.prisma.organization.delete({ where: { id: org.id } });
  }

  async addMember(slug: string, dto: AddMemberDto, userId: string) {
    const org = await this.findBySlug(slug);
    this.assertRole(org.members, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

    if (dto.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot assign OWNER role');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const existing = org.members.find((m) => m.userId === targetUser.id);
    if (existing) {
      throw new ConflictException('User is already a member');
    }

    return this.prisma.organizationMember.create({
      data: {
        organizationId: org.id,
        userId: targetUser.id,
        role: dto.role,
      },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  }

  async removeMember(slug: string, memberId: string, userId: string) {
    const org = await this.findBySlug(slug);
    this.assertRole(org.members, userId, [OrgRole.OWNER, OrgRole.ADMIN]);

    const target = org.members.find((m) => m.id === memberId);
    if (!target) {
      throw new NotFoundException('Member not found');
    }

    if (target.role === OrgRole.OWNER) {
      throw new ForbiddenException('Cannot remove the owner');
    }

    await this.prisma.organizationMember.delete({ where: { id: memberId } });
  }

  async getUserMembership(orgId: string, userId: string) {
    return this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId } },
    });
  }

  private assertRole(
    members: Array<{ userId: string; role: OrgRole }>,
    userId: string,
    allowed: OrgRole[],
  ) {
    const membership = members.find((m) => m.userId === userId);
    if (!membership || !allowed.includes(membership.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
    const base = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = base;
    let counter = 0;

    while (true) {
      const existing = await this.prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (!existing || existing.id === excludeId) {
        return slug;
      }

      counter++;
      slug = `${base}-${counter}`;
    }
  }
}
