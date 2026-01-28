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
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, UpdateDocumentDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases/:kbId/documents')
export class DocumentsController {
  constructor(private readonly docsService: DocumentsService) {}

  @Post()
  create(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: CreateDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.create(slug, kbId, dto, userId);
  }

  @Get()
  findAll(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.findAllByKb(slug, kbId, userId);
  }

  @Get(':docId')
  findOne(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Param('docId') docId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.docsService.findOne(slug, kbId, docId, userId);
  }

  @Patch(':docId')
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
