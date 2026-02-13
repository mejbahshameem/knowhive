import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';

const mockPrismaService = {
  $queryRawUnsafe: jest.fn(),
};

const mockEmbeddingService = {
  embed: jest.fn(),
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
  organizationId: orgId,
};

const mockOrgsService = {
  findBySlug: jest.fn(),
};

const mockKbService = {
  findOne: jest.fn(),
};

describe('SearchService', () => {
  let service: SearchService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
        { provide: OrganizationsService, useValue: mockOrgsService },
        { provide: KnowledgeBasesService, useValue: mockKbService },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    jest.clearAllMocks();

    mockOrgsService.findBySlug.mockResolvedValue(mockOrg);
    mockKbService.findOne.mockResolvedValue(mockKb);
  });

  describe('search', () => {
    it('should return search results with scores', async () => {
      const queryEmbedding = [0.1, 0.2, 0.3];
      mockEmbeddingService.embed.mockResolvedValue(queryEmbedding);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([
        {
          chunk_id: 'chunk-1',
          content: 'Matching chunk content',
          score: 0.95,
          document_id: 'doc-1',
          document_title: 'Test Document',
        },
      ]);

      const results = await service.search(slug, kbId, 'test query', userId);

      expect(mockOrgsService.findBySlug).toHaveBeenCalledWith(slug);
      expect(mockEmbeddingService.embed).toHaveBeenCalledWith('test query');
      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalled();

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        chunkId: 'chunk-1',
        content: 'Matching chunk content',
        score: 0.95,
        documentId: 'doc-1',
        documentTitle: 'Test Document',
      });
    });

    it('should return empty array when no results match', async () => {
      mockEmbeddingService.embed.mockResolvedValue([0.1, 0.2]);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([]);

      const results = await service.search(slug, kbId, 'no match', userId);

      expect(results).toEqual([]);
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockOrgsService.findBySlug.mockResolvedValue({
        ...mockOrg,
        members: [],
      });

      await expect(
        service.search(slug, kbId, 'query', userId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should pass the limit parameter to the query', async () => {
      mockEmbeddingService.embed.mockResolvedValue([0.1]);
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([]);

      await service.search(slug, kbId, 'query', userId, 10);

      expect(mockPrismaService.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        kbId,
        10,
      );
    });
  });
});
