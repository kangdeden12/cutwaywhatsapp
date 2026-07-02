import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OrganizationsService } from './organizations.service';

// TODO (lanjutan Claude Code): organizationId saat ini diambil dari query
// hanya untuk tahap awal. Setelah TenantGuard dibangun (Artefak 05, Bagian
// Keamanan), organizationId HARUS diambil dari JWT/session context, bukan
// dari input pengguna — lihat Artefak 01 Bagian 15 (Multi-Tenant).

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('current')
  async getCurrent(@Query('organizationId') organizationId: string) {
    return this.organizationsService.findCurrent(organizationId);
  }
}
