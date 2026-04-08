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
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  AddMemberDto,
  UpdateMemberRoleDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Organizations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  @ApiResponse({ status: 201, description: 'Organization created' })
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all organizations for the current user' })
  @ApiResponse({ status: 200, description: 'Array of organizations' })
  findAll(@CurrentUser('id') userId: string) {
    return this.orgsService.findAllByUser(userId);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get an organization by slug' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 200, description: 'Organization details' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  findOne(@Param('slug') slug: string) {
    return this.orgsService.findBySlug(slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 200, description: 'Organization updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.update(slug, dto, userId);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 204, description: 'Organization deleted' })
  @ApiResponse({ status: 403, description: 'Only the owner can delete' })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.orgsService.remove(slug, userId);
  }

  @Post(':slug/members')
  @ApiOperation({ summary: 'Add a member to an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 201, description: 'Member added' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  addMember(
    @Param('slug') slug: string,
    @Body() dto: AddMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.addMember(slug, dto, userId);
  }

  @Delete(':slug/members/:memberId')
  @ApiOperation({ summary: 'Remove a member from an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'memberId', description: 'Membership ID to remove' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.removeMember(slug, memberId, userId);
  }

  @Patch(':slug/members/:memberId')
  @ApiOperation({ summary: 'Update a member role' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiParam({ name: 'memberId', description: 'Membership ID to update' })
  @ApiResponse({ status: 200, description: 'Member role updated' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  updateMemberRole(
    @Param('slug') slug: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.orgsService.updateMemberRole(slug, memberId, dto, userId);
  }

  @Get(':slug/members')
  @ApiOperation({ summary: 'List all members of an organization' })
  @ApiParam({ name: 'slug', description: 'Organization URL slug' })
  @ApiResponse({ status: 200, description: 'Array of members' })
  listMembers(@Param('slug') slug: string, @CurrentUser('id') userId: string) {
    return this.orgsService.listMembers(slug, userId);
  }
}
