import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Documents')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases/:kbId/documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a document',
    description: 'Creates a document and triggers async embedding generation',
  })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({
    status: 201,
    description: 'Document created with PENDING embedding status',
  })
  create(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.create(slug, kbId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List documents in a knowledge base' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({ status: 200, description: 'Array of documents' })
  findAll(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.findAllByKb(slug, kbId, userId);
  }

  @Get(':docId')
  @ApiOperation({ summary: 'Get a document by ID' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({
    status: 200,
    description: 'Document details including content and embedding status',
  })
  @ApiResponse({ status: 404, description: 'Document not found' })
  findOne(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.findOne(slug, kbId, docId, userId);
  }

  @Patch(':docId')
  @ApiOperation({
    summary: 'Update a document',
    description:
      'Updates document fields and re-triggers embedding generation if content changes',
  })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document updated' })
  update(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.update(slug, kbId, docId, dto, userId);
  }

  @Delete(':docId')
  @ApiOperation({ summary: 'Delete a document' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiParam({ name: 'docId', description: 'Document ID' })
  @ApiResponse({ status: 204, description: 'Document deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.remove(slug, kbId, docId, userId);
  }
}
