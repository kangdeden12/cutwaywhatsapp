# CutwayWhatsApp — Starter Project

Ini adalah **fondasi kode nyata** (bukan prototipe simulasi) untuk CutwayWhatsApp, dibangun mengikuti **Tahap 0 (Fondasi)** dari roadmap di Artefak 05, dan struktur data dari Artefak 01.

Sudah tersedia dan berfungsi:
- Struktur backend NestJS + Prisma (PostgreSQL) sesuai Artefak 01
- Modul **Auth**: register, login, refresh token (dengan rotasi & deteksi reuse), logout — hashing password pakai Argon2id
- Modul **Organizations**, **Users**, **Roles & Permissions** — dasar sistem multi-tenant & RBAC
- Docker Compose untuk PostgreSQL + Redis lokal
- Struktur frontend Next.js dengan halaman Login/Register dasar

Belum dibangun (lanjutan untuk Claude Code): WhatsApp Connection, Inbox, Broadcast, CRM, Workflow, AI Agent, dan modul lain sesuai Tahap 1–4 di Artefak 05.

---

## Cara Melanjutkan dengan Claude Code

1. **Unduh & ekstrak** file `cutwaywhatsapp-starter.zip` ini ke komputer Anda.
2. **Install Claude Code** (lihat https://docs.claude.com untuk panduan instalasi terbaru — butuh Node.js).
3. Buka folder project ini di terminal, lalu jalankan Claude Code:
   ```bash
   cd cutwaywhatsapp
   claude
   ```
4. **Beri instruksi awal ke Claude Code**, contoh:
   > "Baca README.md, docs/, dan prisma/schema.prisma di project ini. Ini adalah starter CutwayWhatsApp sesuai blueprint di folder docs/. Install dependencies, jalankan docker-compose untuk database lokal, lalu lanjutkan membangun modul WhatsApp Connection sesuai Artefak 01 dan Artefak 02."

Claude Code akan bisa langsung menjalankan `npm install`, menyalakan database lokal lewat Docker, menjalankan migrasi Prisma, dan melanjutkan menulis kode modul berikutnya — karena berjalan di komputer Anda dengan akses internet & environment penuh (berbeda dari chat ini yang tidak punya akses tersebut).

---

## Menjalankan Secara Lokal (Manual, Tanpa Claude Code)

### Prasyarat
- Node.js 20+
- Docker & Docker Compose
- npm atau pnpm

### Langkah

```bash
# 1. Nyalakan database lokal (PostgreSQL + Redis)
docker compose up -d

# 2. Setup backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run start:dev
# Backend berjalan di http://localhost:3001

# 3. Setup frontend (di terminal baru)
cd frontend
cp .env.example .env
npm install
npm run dev
# Frontend berjalan di http://localhost:3000
```

Coba akses `http://localhost:3001/api/v1/health` — jika backend berjalan benar, akan mengembalikan status OK.

---

## Struktur Project

```
cutwaywhatsapp/
├── docs/                    ← Salinan 5 Artefak blueprint (rujukan wajib dibaca sebelum menambah modul)
├── docker-compose.yml       ← PostgreSQL + Redis untuk pengembangan lokal
├── backend/
│   ├── prisma/schema.prisma ← Skema database (mengikuti Artefak 01)
│   └── src/
│       ├── modules/         ← Satu folder per modul bisnis (auth, organizations, users, dst.)
│       ├── common/          ← Guard, decorator, filter yang dipakai lintas modul
│       └── database/        ← Koneksi Prisma
└── frontend/
    ├── app/(auth)/           ← Halaman login/register
    └── app/(app)/            ← Halaman aplikasi utama (setelah login)
```

## Urutan Modul Selanjutnya (Sesuai Roadmap Artefak 05)

Sarankan ke Claude Code untuk membangun secara berurutan:
1. WhatsApp Connection (koneksi WABA)
2. Inbox & Live Chat
3. Contacts, Labels
4. Template Messages
5. Broadcast
6. Subscription & Billing
7. (Tahap 2) CRM, Segments, Analytics, Webhook, REST API publik
8. (Tahap 3) Workflow Automation, AI Agent, Knowledge Base

Setiap modul harus mengacu ke definisi tabel di **Artefak 01**, endpoint di **Artefak 02**, dan desain halaman di **Artefak 03**.

## Keamanan — Jangan Lewatkan Sebelum Deploy ke Produksi

- Ganti semua nilai di `.env.example` dengan rahasia sungguhan sebelum deploy (jangan pernah commit file `.env` asli ke Git)
- Aktifkan Row-Level Security (RLS) di PostgreSQL sesuai Artefak 01 Bagian 15 sebelum menyimpan data pelanggan sungguhan
- Baca Artefak 05 Bagian Keamanan sebelum membuka akses publik
