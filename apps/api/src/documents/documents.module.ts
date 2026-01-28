import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { KnowledgeBasesModule } from '../knowledge-bases/knowledge-bases.module';

@Module({
  imports: [OrganizationsModule, KnowledgeBasesModule],
  controllers: [DocumentsController],
  providers: [DocumentsService],
})
export class DocumentsModule {}
