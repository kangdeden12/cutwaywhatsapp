import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// Implementasi mengikuti Artefak 01 (tabel users, refresh_tokens) dan
// Artefak 05 Bagian Keamanan (hash Argon2id, rotasi refresh token,
// deteksi reuse token — jika token yang sudah dipakai dipakai lagi,
// seluruh "keluarga" token dicabut sebagai tanda kemungkinan pencurian sesi).

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email sudah terdaftar');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
      },
    });

    // TODO (lanjutan Claude Code): kirim email verifikasi di sini,
    // sesuai alur di Artefak 05 (Onboarding: Register -> Verify Email).

    return { userId: user.id, verificationRequired: true };
  }

  async login(dto: LoginDto, deviceInfo?: Record<string, unknown>): Promise<TokenPair & { requires2fa: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const passwordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // TODO (lanjutan Claude Code): jika user.twoFactorEnabled true,
    // kembalikan requires2fa: true dan tunda penerbitan token sampai
    // kode 2FA diverifikasi lewat endpoint terpisah.

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, randomUUID(), deviceInfo);
    return { ...tokens, requires2fa: false };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!stored) {
      throw new UnauthorizedException('Token tidak valid');
    }

    if (stored.revokedAt) {
      // Token yang sudah dicabut tapi dicoba dipakai lagi = indikasi pencurian.
      // Cabut seluruh keluarga token sebagai tindakan pencegahan.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: stored.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Sesi dicurigai tidak aman, silakan login ulang');
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token sudah kedaluwarsa');
    }

    // Rotasi: token lama dicabut, token baru diterbitkan dalam keluarga yang sama
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.userId, stored.familyId, stored.deviceInfo as Record<string, unknown> | undefined);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async issueTokenPair(
    userId: string,
    familyId: string,
    deviceInfo?: Record<string, unknown>,
  ): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
      },
    );

    const rawRefreshToken = randomUUID() + randomUUID();
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(rawRefreshToken),
        familyId,
        expiresAt: addDuration(new Date(), refreshExpiresIn),
        deviceInfo: deviceInfo ?? undefined,
      },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

// Utilitas kecil: mengubah string durasi seperti "30d" / "15m" menjadi tanggal jatuh tempo.
function addDuration(base: Date, duration: string): Date {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000); // default 30 hari
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(base.getTime() + value * multipliers[unit]);
}
