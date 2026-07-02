import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// Lapisan akses database tunggal untuk seluruh modul.
// Saat sistem berkembang ke Row-Level Security (Artefak 01, Bagian 15),
// tambahkan di sini logika `SET app.current_org` per-request menggunakan
// middleware/interceptor yang membaca organizationId dari request context.

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
