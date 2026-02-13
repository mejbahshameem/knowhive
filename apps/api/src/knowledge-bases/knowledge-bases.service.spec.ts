import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { KnowledgeBasesService } from './knowledge-bases.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';

const mockPrismaService = {
  knowledgeBase: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const userId = 'user-1';
const slug = 'test-org';
const orgId = 'org-1';
const kbId = 'kb-1';

const mockOrg = {
  id: orgId,
  name: 'Test Org',
  slug,
  members: [
    { id: 'member-1', userId, role: 'OWNER', user: { id: userId, email: 'owner@example.com', name: 'Owner' } },
  ],
  _count: { knowledgeBases: 1 },
};

const mockKb = {
  id: kbId,
  name: 'Test KB',
  description: 'A test knowledge base',
  organizationId: orgId,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrgsService = {
  findBySlug: jest.fn().mockResolvedValue(mockOrg),
};

describe('KnowledgeBasesService', () => {
  let service: KnowledgeBasesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeBasesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrgsService },
      ],
    }).compile();

    service = module.get<KnowledgeBasesService>(KnowledgeBasesService);
    jest.clearAllMocks();
    mockOrgsService.findBySlug.mockResolvedValue(mockOrg);
  });

  describe('create', () => {
    it('should create a knowledge base for a valid member', async () => {
      mockPrismaService.knowledgeBase.create.mockResolvedValue(mockKb);

      const result = await service.create(slug, { name: 'Test KB', description: 'A test knowledge base' }, userId);

      expect(mockOrgsService.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockPrismaService.knowledgeBase.create).toHaveBeenCalledWith({
        data: { name: 'Test KB', description: 'A test knowledge base', organizationId: orgId },
      });
      expect(result).toEqual(mockKb);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [],
      });

      await expect(
        service.create(slug, { name: 'Test KB' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByOrg', () => {
    it('should return all knowledge bases for the organization', async () => {
      mockPrismaService.knowledgeBase.findMany.mockResolvedValue([mockKb]);

      const result = await service.findAllByOrg(slug, userId);

      expect(result).toEqual([mockKb]);
    });
  });

  describe('findOne', () => {
    it('should return the knowledge base', async () => {
      mockPrismaService.knowledgeBase.findUnique.mockResolvedValue(mockKb);

      const result = await service.findOne(slug, kbId, userId);

      expect(result).toEqual(mockKb);
    });

    it('should throw NotFoundException if KB not found', async () => {
      mockPrismaService.knowledgeBase.findUnique.mockResolvedValue(null);

      await expect(service.findOne(slug, kbId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if KB belongs to a different org', async () => {
      mockPrismaService.knowledgeBase.findUnique.mockResolvedValue({
        ...mockKb,
        organizationId: 'other-org-id',
      });

      await expect(service.findOne(slug, kbId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update the knowledge base', async () => {
      mockPrismaService.knowledgeBase.findUnique.mockResolvedValue(mockKb);
      mockPrismaService.knowledgeBase.update.mockResolvedValue({
        ...mockKb,
        name: 'Updated KB',
      });

      const result = await service.update(slug, kbId, { name: 'Updated KB' }, userId);

      expect(result.name).toBe('Updated KB');
    });
  });

  describe('remove', () => {
    it('should delete the KB if user is OWNER or ADMIN', async () => {
      mockPrismaService.knowledgeBase.findUnique.mockResolvedValue(mockKb);
      mockPrismaService.knowledgeBase.delete.mockResolvedValue(undefined);

      await service.remove(slug, kbId, userId);

      expect(mockPrismaService.knowledgeBase.delete).toHaveBeenCalledWith({
        where: { id: kbId },
      });
    });

    it('should throw ForbiddenException if user is a MEMBER', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [{ id: 'member-1', userId, role: 'MEMBER' }],
      });

      await expect(service.remove(slug, kbId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if user is not a member at all', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [],
      });

      await expect(service.remove(slug, kbId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
