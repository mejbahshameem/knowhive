import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';
import { ChunkingService } from '../ai/chunking.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orgsService: OrganizationsService,
    private readonly kbService: KnowledgeBasesService,
    private readonly chunkingService: ChunkingService,
  ) {}

  async create(
    slug: string,
    kbId: string,
    dto: CreateDocumentDto,
    userId: string,
  ) {
    await this.resolveOrgAndKb(slug, kbId, userId);

    const document = await this.prisma.document.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: 'PENDING',
        knowledgeBaseId: kbId,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    this.chunkingService.processDocument(document.id).catch(() => {});

    return document;
  }

  async findAllByKb(slug: string, kbId: string, userId: string) {
    await this.resolveOrgAndKb(slug, kbId, userId);

    return this.prisma.document.findMany({
      where: { knowledgeBaseId: kbId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        createdBy: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(slug: string, kbId: string, docId: string, userId: string) {
    await this.resolveOrgAndKb(slug, kbId, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (!doc || doc.knowledgeBaseId !== kbId) {
      throw new NotFoundException('Document not found');
    }

    return doc;
  }

  async update(
    slug: string,
    kbId: string,
    docId: string,
    dto: UpdateDocumentDto,
    userId: string,
  ) {
    const doc = await this.findOne(slug, kbId, docId, userId);

    const updated = await this.prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && {
          content: dto.content,
          status: 'PENDING' as const,
        }),
      },
      include: {
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    if (dto.content !== undefined) {
      this.chunkingService.processDocument(updated.id).catch(() => {});
    }

    return updated;
  }

  async remove(slug: string, kbId: string, docId: string, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    const membership = org.members.find((m) => m.userId === userId);

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    if (membership.role === 'MEMBER') {
      throw new ForbiddenException('Members cannot delete documents');
    }

    await this.kbService.findOne(slug, kbId, userId);

    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });

    if (!doc || doc.knowledgeBaseId !== kbId) {
      throw new NotFoundException('Document not found');
    }

    await this.prisma.document.delete({ where: { id: doc.id } });
  }

  private async resolveOrgAndKb(slug: string, kbId: string, userId: string) {
    const org = await this.orgsService.findBySlug(slug);
    const membership = org.members.find((m) => m.userId === userId);

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    const kb = await this.kbService.findOne(slug, kbId, userId);

    return { org, kb, membership };
  }
}
