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
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.create(dto, userId);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.orgsService.findAllByUser(userId);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.orgsService.findBySlug(slug);
  }

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.update(slug, dto, userId);
  }

  @Delete(':slug')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.orgsService.remove(slug, userId);
  }

  @Post(':slug/members')
  addMember(
    @Param('slug') slug: string,
    @Body() dto: AddMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.addMember(slug, dto, userId);
  }

  @Delete(':slug/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.removeMember(slug, memberId, userId);
  }
}
