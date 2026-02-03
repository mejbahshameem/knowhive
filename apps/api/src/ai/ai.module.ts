import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { ChunkingService } from './chunking.service';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';

@Module({
  imports: [OrganizationsModule, KnowledgeBasesModule],
  controllers: [SearchController],
  providers: [EmbeddingService, ChunkingService, SearchService],
  exports: [ChunkingService],
})
export class AiModule {}
