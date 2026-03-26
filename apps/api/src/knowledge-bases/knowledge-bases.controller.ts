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
import { KnowledgeBasesService } from './knowledge-bases.service';
import { CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Knowledge Bases')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases')
export class KnowledgeBasesController {
  constructor(private readonly kbService: KnowledgeBasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a knowledge base' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 201, description: 'Knowledge base created' })
  create(
    @Param('slug') slug: string,
    @Body() dto: CreateKnowledgeBaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.create(slug, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List knowledge bases in an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 200, description: 'Array of knowledge bases' })
  findAll(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.kbService.findAllByOrg(slug, userId);
  }

  @Get(':kbId')
  @ApiOperation({ summary: 'Get a knowledge base by ID' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({ status: 200, description: 'Knowledge base details' })
  @ApiResponse({ status: 404, description: 'Knowledge base not found' })
  findOne(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.findOne(slug, kbId, userId);
  }

  @Patch(':kbId')
  @ApiOperation({ summary: 'Update a knowledge base' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({ status: 200, description: 'Knowledge base updated' })
  update(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: UpdateKnowledgeBaseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.update(slug, kbId, dto, userId);
  }

  @Delete(':kbId')
  @ApiOperation({ summary: 'Delete a knowledge base' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({ status: 204, description: 'Knowledge base deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.kbService.remove(slug, kbId, userId);
  }
}
