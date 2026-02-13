import { Test, TestingModule } from '@nestjs/testing';
import { ChunkingService } from './chunking.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

const mockPrismaService = {
  document: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  documentChunk: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
  $executeRawUnsafe: jest.fn(),
};

const mockEmbeddingService = {
  isAvailable: true,
  embedBatch: jest.fn(),
};

describe('ChunkingService', () => {
  let service: ChunkingService;

  const documentId = 'doc-1';
  const mockDocument = {
    id: documentId,
    title: 'Test Doc',
    content: 'This is a test document with some content.',
    status: 'PENDING',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChunkingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmbeddingService, useValue: mockEmbeddingService },
      ],
    }).compile();

    service = module.get<ChunkingService>(ChunkingService);
    jest.clearAllMocks();

    mockEmbeddingService.isAvailable = true;
  });

  describe('splitText', () => {
    it('should split text into chunks by paragraphs', () => {
      const text = 'First paragraph.\n\nSecond paragraph.\n\nThird paragraph.';
      const chunks = service.splitText(text);

      expect(chunks.length).toBeGreaterThanOrEqual(1);
      expect(chunks[0]).toContain('First paragraph');
    });

    it('should return empty array for empty text', () => {
      const chunks = service.splitText('');
      expect(chunks).toEqual([]);
    });

    it('should return empty array for whitespace-only text', () => {
      const chunks = service.splitText('   \n\n   ');
      expect(chunks).toEqual([]);
    });

    it('should keep short text as a single chunk', () => {
      const text = 'Short paragraph.';
      const chunks = service.splitText(text);

      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Short paragraph.');
    });

    it('should create multiple chunks for long text', () => {
      const paragraph = 'A'.repeat(300);
      const text = `${paragraph}\n\n${paragraph}\n\n${paragraph}`;
      const chunks = service.splitText(text);

      expect(chunks.length).toBeGreaterThan(1);
    });
  });

  describe('processDocument', () => {
    it('should process document with embeddings when available', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue(undefined);
      mockPrismaService.documentChunk.deleteMany.mockResolvedValue(undefined);
      mockEmbeddingService.embedBatch.mockResolvedValue([[0.1, 0.2, 0.3]]);
      mockPrismaService.$executeRawUnsafe.mockResolvedValue(undefined);

      await service.processDocument(documentId);

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'PROCESSING' },
      });
      expect(mockPrismaService.documentChunk.deleteMany).toHaveBeenCalledWith({
        where: { documentId },
      });
      expect(mockEmbeddingService.embedBatch).toHaveBeenCalled();
      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'READY' },
      });
    });

    it('should store chunks without embeddings when API key is not set', async () => {
      mockEmbeddingService.isAvailable = false;
      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue(undefined);
      mockPrismaService.documentChunk.deleteMany.mockResolvedValue(undefined);
      mockPrismaService.documentChunk.create.mockResolvedValue(undefined);

      await service.processDocument(documentId);

      expect(mockPrismaService.documentChunk.create).toHaveBeenCalled();
      expect(mockEmbeddingService.embedBatch).not.toHaveBeenCalled();
      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'READY' },
      });
    });

    it('should return early if document not found', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await service.processDocument('nonexistent');

      expect(mockPrismaService.document.update).not.toHaveBeenCalled();
    });

    it('should set status to FAILED on error', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue(mockDocument);
      mockPrismaService.document.update.mockResolvedValue(undefined);
      mockPrismaService.documentChunk.deleteMany.mockResolvedValue(undefined);
      mockEmbeddingService.embedBatch.mockRejectedValue(new Error('API error'));

      await service.processDocument(documentId);

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });
    });

    it('should set status to READY for empty content', async () => {
      mockPrismaService.document.findUnique.mockResolvedValue({
        ...mockDocument,
        content: '',
      });
      mockPrismaService.document.update.mockResolvedValue(undefined);
      mockPrismaService.documentChunk.deleteMany.mockResolvedValue(undefined);

      await service.processDocument(documentId);

      expect(mockPrismaService.document.update).toHaveBeenCalledWith({
        where: { id: documentId },
        data: { status: 'READY' },
      });
      expect(mockEmbeddingService.embedBatch).not.toHaveBeenCalled();
    });
  });
});
