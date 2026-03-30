import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { SearchService } from './search.service';
import { SearchDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Search')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases/:kbId/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @ApiOperation({
    summary: 'Semantic search',
    description:
      'Perform AI powered semantic search across documents in a knowledge base using vector embeddings',
  })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'kbId', description: 'Knowledge base ID' })
  @ApiResponse({
    status: 201,
    description: 'Array of matching document chunks ranked by relevance',
  })
  search(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: SearchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.searchService.search(slug, kbId, dto.query, userId, dto.limit);
  }
}
