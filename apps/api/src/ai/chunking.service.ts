import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  async processDocument(documentId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      this.logger.error(`Document ${documentId} not found`);
      return;
    }

    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    try {
      await this.prisma.documentChunk.deleteMany({
        where: { documentId },
      });

      const chunks = this.splitText(document.content);

      if (chunks.length === 0) {
        await this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'READY' },
        });
        return;
      }

      if (!this.embeddingService.isAvailable) {
        for (let i = 0; i < chunks.length; i++) {
          await this.prisma.documentChunk.create({
            data: {
              content: chunks[i],
              index: i,
              documentId,
            },
          });
        }

        await this.prisma.document.update({
          where: { id: documentId },
          data: { status: 'READY' },
        });

        this.logger.warn(
          `Document ${documentId}: stored ${chunks.length} chunks without embeddings (no API key)`,
        );
        return;
      }

      const embeddings = await this.embeddingService.embedBatch(chunks);

      for (let i = 0; i < chunks.length; i++) {
        const vectorLiteral = `[${embeddings[i].join(',')}]`;

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO document_chunks (id, content, index, embedding, "documentId")
           VALUES (gen_random_uuid(), $1, $2, $3::vector, $4)`,
          chunks[i],
          i,
          vectorLiteral,
          documentId,
        );
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'READY' },
      });

      this.logger.log(
        `Document ${documentId}: processed ${chunks.length} chunks with embeddings`,
      );
    } catch (error: unknown) {
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' },
      });

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Document ${documentId}: processing failed - ${message}`,
      );
    }
  }

  splitText(text: string): string[] {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
    const chunks: string[] = [];

    let buffer = '';

    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();

      if (
        buffer.length + trimmed.length + 1 > CHUNK_SIZE &&
        buffer.length > 0
      ) {
        chunks.push(buffer.trim());
        const words = buffer.split(' ');
        const overlapWords = words.slice(-CHUNK_OVERLAP);
        buffer = overlapWords.join(' ') + ' ' + trimmed;
      } else {
        buffer = buffer.length > 0 ? buffer + '\n\n' + trimmed : trimmed;
      }
    }

    if (buffer.trim().length > 0) {
      chunks.push(buffer.trim());
    }

    return chunks;
  }
}
