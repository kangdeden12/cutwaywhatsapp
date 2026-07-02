import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Mengikuti Artefak 02 Bagian 3 (API Organisasi & Anggota Tim).
// TODO (lanjutan Claude Code): tambahkan method invite member, list members,
// update role, dan penegakan SEAT_LIMIT_REACHED sesuai kuota plan_features.

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findCurrent(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      include: { settings: true },
    });
    if (!org || org.deletedAt) {
      throw new NotFoundException('Organisasi tidak ditemukan');
    }
    return org;
  }

  async createForOwner(params: { name: string; slug: string; tier: string; ownerUserId: string }) {
    // Membuat organisasi baru + peran default (Owner) + menjadikan
    // pengguna pendaftar sebagai anggota pertama dengan peran Owner.
    // Sesuai alur "Company Created" di Artefak 03/05 (Complete Workflow).
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: params.name,
          slug: params.slug,
          tier: params.tier as any,
        },
      });

      const ownerRole = await tx.role.create({
        data: {
          organizationId: organization.id,
          name: 'Owner',
          isSystem: true,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: params.ownerUserId,
          roleId: ownerRole.id,
          status: 'active',
          joinedAt: new Date(),
        },
      });

      await tx.organizationSettings.create({
        data: { organizationId: organization.id },
      });

      return organization;
    });
  }
}
