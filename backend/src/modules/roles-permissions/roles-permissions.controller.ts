import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesPermissionsService } from './roles-permissions.service';

@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesPermissionsController {
  constructor(private readonly service: RolesPermissionsService) {}

  @Get()
  async list(@Query('organizationId') organizationId: string) {
    return this.service.listRolesForOrganization(organizationId);
  }
}
