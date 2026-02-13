import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';
import { ChunkingService } from '../ai/chunking.service';

const mockPrismaService = {
  document: {
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
const docId = 'doc-1';

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
  description: '',
  organizationId: orgId,
};

const mockDoc = {
  id: docId,
  title: 'Test Document',
  content: 'Some content for testing',
  status: 'PENDING',
  knowledgeBaseId: kbId,
  createdById: userId,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: { id: userId, email: 'owner@example.com', name: 'Owner' },
};

const mockOrgsService = {
  findBySlug: jest.fn(),
};

const mockKbService = {
  findOne: jest.fn(),
};

const mockChunkingService = {
  processDocument: jest.fn().mockResolvedValue(undefined),
};

describe('DocumentsService', () => {
  let service: DocumentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: OrganizationsService, useValue: mockOrgsService },
        { provide: KnowledgeBasesService, useValue: mockKbService },
        { provide: ChunkingService, useValue: mockChunkingService },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
    jest.clearAllMocks();

    mockOrgsService.findBySlug.mockResolvedValue(mockOrg);
    mockKbService.findOne.mockResolvedValue(mockKb);
    mockChunkingService.processDocument.mockResolvedValue(undefined);
  });

  describe('create', () => {
    it('should create a document with PENDING status and trigger processing', async () => {
      mockPrismaService.document.create.mockResolvedValue(mockDoc);

      const result = await service.create(
        slug,
        kbId,
        { title: 'Test Document', content: 'Some content for testing' },
        userId,
      );

      expect(mockPrismaService.document.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'PENDING',
            knowledgeBaseId: kbId,
            createdById: userId,
          }),
        }),
      );
      expect(mockChunkingService.processDocument).toHaveBeenCalledWith(docId);
      expect(result).toEqual(mockDoc);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [],
      });

      await expect(
        service.create(slug, kbId, { title: 'Test', content: 'Content' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAllByKb', () => {
    it('should return all documents for a knowledge base', async () => {
      mockPrismaService.document.findMany.mockResolvedValue([mockDoc]);

      const result = await service.findAllByKb(slug, kbId, userId);

      expect(mockPrismaService.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { knowledgeBaseId: kbId },
        }),
      );
      expect(result).toEqual([mockDoc]);
    });
  });

  describe('findOne', () => {
    it('should return the document', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDoc);

      const result = await service.findOne(slug, kbId, docId, userId);

      expect(result).toEqual(mockDoc);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne(slug, kbId, docId, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if doc belongs to different KB', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue({
        ...mockDoc,
        knowledgeBaseId: 'other-kb-id',
      });

      await expect(
        service.findOne(slug, kbId, docId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update title without triggering reprocessing', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDoc);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDoc,
        title: 'Updated Title',
      });

      await service.update(slug, kbId, docId, { title: 'Updated Title' }, userId);

      expect(mockChunkingService.processDocument).not.toHaveBeenCalled();
    });

    it('should trigger reprocessing when content is updated', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDoc);
      mockPrismaService.document.update.mockResolvedValue({
        ...mockDoc,
        content: 'New content',
        status: 'PENDING',
      });

      await service.update(slug, kbId, docId, { content: 'New content' }, userId);

      expect(mockChunkingService.processDocument).toHaveBeenCalledWith(docId);
    });
  });

  describe('remove', () => {
    it('should delete document if user is OWNER', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDoc);
      mockPrismaService.document.delete.mockResolvedValue(undefined);

      await service.remove(slug, kbId, docId, userId);

      expect(mockPrismaService.document.delete).toHaveBeenCalledWith({
        where: { id: docId },
      });
    });

    it('should throw ForbiddenException if user is MEMBER role', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [{ id: 'member-1', userId, role: 'MEMBER' }],
      });

      await expect(
        service.remove(slug, kbId, docId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [],
      });

      await expect(
        service.remove(slug, kbId, docId, userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if document not found', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(
        service.remove(slug, kbId, docId, userId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
