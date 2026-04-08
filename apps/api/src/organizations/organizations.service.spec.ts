import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  organization: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  organizationMember: {
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const userId = 'user-1';
  const orgId = 'org-1';
  const slug = 'test-org';

  const mockOrg = {
    id: orgId,
    name: 'Test Org',
    slug,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: 'member-1',
        userId,
        role: 'OWNER',
        user: { id: userId, email: 'owner@example.com', name: 'Owner' },
      },
    ],
    _count: { knowledgeBases: 2 },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an organization with the user as OWNER', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);
      mockPrismaService.organization.create.mockResolvedValue(mockOrg);

      const result = await service.create({ name: 'Test Org' }, userId);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Test Org',
            slug: 'test-org',
            members: { create: { userId, role: 'OWNER' } },
          }),
        }),
      );
      expect(result).toEqual(mockOrg);
    });

    it('should generate unique slug when slug already exists', async () => {
      mockPrismaService.organization.findUnique
        .mockResolvedValueOnce({ id: 'other-org' }) // first slug taken
        .mockResolvedValueOnce(null); // slug-1 available
      mockPrismaService.organization.create.mockResolvedValue(mockOrg);

      await service.create({ name: 'Test Org' }, userId);

      expect(mockPrismaService.organization.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'test-org-1' }),
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return organizations where the user is a member', async () => {
      const memberships = [
        {
          role: 'OWNER',
          joinedAt: new Date(),
          organization: {
            id: orgId,
            name: 'Test Org',
            slug,
            _count: { members: 1, knowledgeBases: 2 },
          },
        },
      ];
      mockPrismaService.organizationMember.findMany.mockResolvedValue(
        memberships,
      );

      const result = await service.findAllByUser(userId);

      expect(result[0]).toHaveProperty('role', 'OWNER');
      expect(result[0]).toHaveProperty('name', 'Test Org');
    });
  });

  describe('findBySlug', () => {
    it('should return the organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.findBySlug(slug);

      expect(result).toEqual(mockOrg);
    });

    it('should throw NotFoundException if org not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update the organization name and slug', async () => {
      mockPrismaService.organization.findUnique
        .mockResolvedValueOnce(mockOrg) // findBySlug
        .mockResolvedValueOnce(null); // generateUniqueSlug
      mockPrismaService.organization.update.mockResolvedValue({
        ...mockOrg,
        name: 'Updated Org',
        slug: 'updated-org',
      });

      const result = await service.update(
        slug,
        { name: 'Updated Org' },
        userId,
      );

      expect(mockPrismaService.organization.update).toHaveBeenCalledWith({
        where: { id: orgId },
        data: { name: 'Updated Org', slug: 'updated-org' },
      });
      expect(result.name).toBe('Updated Org');
    });

    it('should throw ForbiddenException if user is not OWNER or ADMIN', async () => {
      const orgWithMember = {
        ...mockOrg,
        members: [{ id: 'member-1', userId, role: 'MEMBER' }],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithMember,
      );

      await expect(
        service.update(slug, { name: 'Updated' }, userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete the organization if user is OWNER', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.organization.delete.mockResolvedValue(undefined);

      await service.remove(slug, userId);

      expect(mockPrismaService.organization.delete).toHaveBeenCalledWith({
        where: { id: orgId },
      });
    });

    it('should throw ForbiddenException if user is not OWNER', async () => {
      const orgWithAdmin = {
        ...mockOrg,
        members: [{ id: 'member-1', userId, role: 'ADMIN' }],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(orgWithAdmin);

      await expect(service.remove(slug, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMember', () => {
    const addMemberDto = {
      email: 'newmember@example.com',
      role: 'MEMBER' as const,
    };

    it('should add a member to the organization', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: addMemberDto.email,
      });
      mockPrismaService.organizationMember.create.mockResolvedValue({
        organizationId: orgId,
        userId: 'user-2',
        role: 'MEMBER',
      });

      const result = await service.addMember(slug, addMemberDto, userId);

      expect(mockPrismaService.organizationMember.create).toHaveBeenCalled();
      expect(result.role).toBe('MEMBER');
    });

    it('should throw ForbiddenException when assigning OWNER role', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(
        service.addMember(
          slug,
          { email: 'test@example.com', role: 'OWNER' as any },
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if target user not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember(slug, addMemberDto, userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is already a member', async () => {
      const orgWithExistingMember = {
        ...mockOrg,
        members: [
          ...mockOrg.members,
          { id: 'member-2', userId: 'user-2', role: 'MEMBER' },
        ],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithExistingMember,
      );
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-2',
        email: addMemberDto.email,
      });

      await expect(
        service.addMember(slug, addMemberDto, userId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('removeMember', () => {
    it('should remove a member from the organization', async () => {
      const orgWithMembers = {
        ...mockOrg,
        members: [
          ...mockOrg.members,
          { id: 'member-2', userId: 'user-2', role: 'MEMBER' },
        ],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithMembers,
      );
      mockPrismaService.organizationMember.delete.mockResolvedValue(undefined);

      await service.removeMember(slug, 'member-2', userId);

      expect(mockPrismaService.organizationMember.delete).toHaveBeenCalledWith({
        where: { id: 'member-2' },
      });
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(
        service.removeMember(slug, 'nonexistent-member', userId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when removing the owner', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(
        service.removeMember(slug, 'member-1', userId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getUserMembership', () => {
    it('should return the membership record', async () => {
      const membership = { organizationId: orgId, userId, role: 'OWNER' };
      mockPrismaService.organizationMember.findUnique.mockResolvedValue(
        membership,
      );

      const result = await service.getUserMembership(orgId, userId);

      expect(result).toEqual(membership);
    });
  });

  describe('updateMemberRole', () => {
    const orgWithMembers = {
      ...mockOrg,
      members: [
        ...mockOrg.members,
        {
          id: 'member-2',
          userId: 'user-2',
          role: 'MEMBER',
          user: { id: 'user-2', email: 'member@example.com', name: 'Member' },
        },
      ],
    };

    it('should update a member role when called by the owner', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithMembers,
      );
      mockPrismaService.organizationMember.update.mockResolvedValue({
        id: 'member-2',
        role: 'ADMIN',
        user: { id: 'user-2', email: 'member@example.com', name: 'Member' },
      });

      const result = await service.updateMemberRole(
        slug,
        'member-2',
        { role: 'ADMIN' as any },
        userId,
      );

      expect(mockPrismaService.organizationMember.update).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: 'ADMIN' },
        include: { user: { select: { id: true, email: true, name: true } } },
      });
      expect(result.role).toBe('ADMIN');
    });

    it('should throw ForbiddenException when trying to change the owner role', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(
        service.updateMemberRole(
          slug,
          'member-1',
          { role: 'ADMIN' as any },
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when assigning OWNER role', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithMembers,
      );

      await expect(
        service.updateMemberRole(
          slug,
          'member-2',
          { role: 'OWNER' as any },
          userId,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when an admin tries to change another admin', async () => {
      const orgWithAdmins = {
        ...mockOrg,
        members: [
          { id: 'member-admin', userId: 'admin-1', role: 'ADMIN' },
          { id: 'member-admin-2', userId: 'admin-2', role: 'ADMIN' },
        ],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgWithAdmins,
      );

      await expect(
        service.updateMemberRole(
          slug,
          'member-admin-2',
          { role: 'MEMBER' as any },
          'admin-1',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when the target member does not exist', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(
        service.updateMemberRole(
          slug,
          'nonexistent',
          { role: 'ADMIN' as any },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when a regular member tries to change roles', async () => {
      const orgMemberCaller = {
        ...mockOrg,
        members: [
          { id: 'member-1', userId, role: 'OWNER' },
          { id: 'member-2', userId: 'user-2', role: 'MEMBER' },
          { id: 'member-3', userId: 'user-3', role: 'MEMBER' },
        ],
      };
      mockPrismaService.organization.findUnique.mockResolvedValue(
        orgMemberCaller,
      );

      await expect(
        service.updateMemberRole(
          slug,
          'member-2',
          { role: 'ADMIN' as any },
          'user-3',
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('listMembers', () => {
    it('should return all members for an authorized user', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      const result = await service.listMembers(slug, userId);

      expect(result).toEqual(mockOrg.members);
    });

    it('should throw ForbiddenException for a non member', async () => {
      mockPrismaService.organization.findUnique.mockResolvedValue(mockOrg);

      await expect(service.listMembers(slug, 'unknown-user')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
