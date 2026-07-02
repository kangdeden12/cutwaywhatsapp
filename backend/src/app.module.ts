import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { UsersModule } from './modules/users/users.module';
import { RolesPermissionsModule } from './modules/roles-permissions/roles-permissions.module';
import { HealthController } from './health.controller';

// Modul berikutnya (WhatsAppConnection, Inbox, Broadcast, dst.) ditambahkan
// di sini secara bertahap mengikuti roadmap di Artefak 05.

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Batas dasar sesuai Artefak 02 Bagian 1.4 — endpoint auth punya batas lebih ketat sendiri
        ttl: 60000,
        limit: 300,
      },
    ]),
    DatabaseModule,
    AuthModule,
    OrganizationsModule,
    UsersModule,
    RolesPermissionsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
