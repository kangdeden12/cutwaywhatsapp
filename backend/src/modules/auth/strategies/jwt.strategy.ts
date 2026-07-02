import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// Dipakai oleh JwtAuthGuard di seluruh modul yang butuh pengguna login.
// Payload token hanya berisi `sub` (user id) — data lengkap pengguna
// (termasuk organisasi aktif) diambil dari database saat dibutuhkan,
// bukan disimpan di dalam token, agar perubahan hak akses langsung berlaku.

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') ?? 'dev-secret-ganti-ini',
    });
  }

  async validate(payload: { sub: string }) {
    // Hasil return ini akan tersedia sebagai `request.user` di seluruh controller
    return { userId: payload.sub };
  }
}
