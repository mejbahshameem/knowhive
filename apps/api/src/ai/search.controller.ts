import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations/:slug/knowledge-bases/:kbId/search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  search(
    @Param('slug') slug: string,
    @Param('kbId') kbId: string,
    @Body() dto: SearchDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.searchService.search(slug, kbId, dto.query, userId);
  }
}
