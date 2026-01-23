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
import { KnowledgeBasesService } from './knowledge-bases.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases')
export class KnowledgeBasesController {
  constructor(private readonly kbService: KnowledgeBasesService) {}

  @Post()
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateKnowledgeBaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.create(slug, dto, userId);
  }

  @Get()
  findAll(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.kbService.findAllByOrg(slug, userId);
  }

  @Get(':kbId')
  findOne(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.findOne(slug, kbId, userId);
  }

  @Patch(':kbId')
  update(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: UpdateKnowledgeBaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.update(slug, kbId, dto, userId);
  }

  @Delete(':kbId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.remove(slug, kbId, userId);
  }
}
