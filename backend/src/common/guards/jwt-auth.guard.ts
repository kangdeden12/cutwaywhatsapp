import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Pakai lewat: @UseGuards(JwtAuthGuard) di controller/endpoint yang butuh login.
// Lihat Artefak 05 Bagian Keamanan untuk aturan lengkap RBAC & tenant isolation
// yang akan dibangun di atas guard ini (PermissionsGuard, TenantGuard).
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
