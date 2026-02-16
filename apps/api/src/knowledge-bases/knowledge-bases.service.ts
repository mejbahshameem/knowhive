import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto';

@Injectable()
export class KnowledgeBasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
  ) {}

  async create(slug: string, dto: CreateKnowledgeBaseDto, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    this.assertMember(org.members, userId);

    return this.prisma.knowledgeBase.create({
      data: {
        name: dto.name,
        description: dto.description ?? '',
        organizationId: org.id,
      },
    });
  }

  async findAllByOrg(slug: string, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    this.assertMember(org.members, userId);

    return this.prisma.knowledgeBase.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(slug: string, kbId: string, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    this.assertMember(org.members, userId);

    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { id: kbId },
    });

    if (!kb || kb.organizationId !== org.id) {
      throw new NotFoundException('Knowledge base not found');
    }

    return kb;
  }

  async update(
    slug: string,
    kbId: string,
    dto: UpdateKnowledgeBaseDto,
    userId: string,
  ) {
    const kb = await this.findOne(slug, kbId, userId);

    return this.prisma.knowledgeBase.update({
      where: { id: kb.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(slug: string, kbId: string, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    const membership = org.members.find((m) => m.userId === userId);

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    if (membership.role === 'MEMBER') {
      throw new ForbiddenException('Members cannot delete knowledge bases');
    }

    const kb = await this.prisma.knowledgeBase.findUnique({
      where: { id: kbId },
    });

    if (!kb || kb.organizationId !== org.id) {
      throw new NotFoundException('Knowledge base not found');
    }

    await this.prisma.knowledgeBase.delete({ where: { id: kb.id } });
  }

  private assertMember(members: Array<{ userId: string }>, userId: string) {
    if (!members.some((m) => m.userId === userId)) {
      throw new ForbiddenException('Not a member of this organization');
    }
  }
}
