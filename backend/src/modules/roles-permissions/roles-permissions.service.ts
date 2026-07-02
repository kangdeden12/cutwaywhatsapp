import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

// Sesuai Artefak 01 Bagian 6.5-6.7 (roles, permissions, role_permissions).
// TODO (lanjutan Claude Code): tambahkan seed data untuk peran bawaan sistem
// (Owner, Admin, Supervisor, Agent, Viewer) dan katalog permission lengkap
// sesuai daftar modul di Artefak 02.

@Injectable()
export class RolesPermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listRolesForOrganization(organizationId: string) {
    return this.prisma.role.findMany({
      where: {
        OR: [{ organizationId }, { organizationId: null, isSystem: true }],
      },
      include: { rolePermissions: { include: { permission: true } } },
    });
  }
}
