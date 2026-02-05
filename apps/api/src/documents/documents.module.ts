import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [OrganizationsModule, KnowledgeBasesModule, AiModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
