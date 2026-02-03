import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingService } from './embedding.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { KnowledgeBasesService } from '../knowledge-bases/knowledge-bases.service';

export interface SearchResult {
  chunkId: string;
  content: string;
  score: number;
  documentId: string;
  documentTitle: string;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddingService: EmbeddingService,
    private readonly orgsService: OrganizationsService,
    private readonly kbService: KnowledgeBasesService,
  ) {}

  async search(
    slug: string,
    kbId: string,
    query: string,
    userId: string,
    limit = 5,
  ): Promise<SearchResult[]> {
    const org = await this.orgsService.findBySlug(slug);
    const membership = org.members.find((m) => m.userId === userId);

    if (!membership) {
      throw new ForbiddenException('Not a member of this organization');
    }

    await this.kbService.findOne(slug, kbId, userId);

    const queryEmbedding = await this.embeddingService.embed(query);
    const vectorLiteral = `[${queryEmbedding.join(',')}]`;

    const results = await this.prisma.$queryRawUnsafe<
      { chunk_id: string; content: string; score: number; document_id: string; document_title: string }[]
    >(
      `SELECT
        dc.id AS chunk_id,
        dc.content,
        1 - (dc.embedding <=> $1::vector) AS score,
        d.id AS document_id,
        d.title AS document_title
      FROM document_chunks dc
      JOIN documents d ON d.id = dc."documentId"
      WHERE d."knowledgeBaseId" = $2
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> $1::vector
      LIMIT $3`,
      vectorLiteral,
      kbId,
      limit,
    );

    return results.map((r) => ({
      chunkId: r.chunk_id,
      content: r.content,
      score: Number(r.score),
      documentId: r.document_id,
      documentTitle: r.document_title,
    }));
  }
}
