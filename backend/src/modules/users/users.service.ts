import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatarFileId: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        status: true,
        memberships: {
          select: {
            organizationId: true,
            status: true,
            role: { select: { id: true, name: true } },
          },
        },
      },
    });
    if (!user || user.status === 'disabled') {
      throw new NotFoundException('Pengguna tidak ditemukan');
    }
    return user;
  }
}
