# ARTEFAK 02 — SPESIFIKASI API LENGKAP CUTWAYWHATSAPP

**Untuk:** Product Owner / Founder CutwayWhatsApp
**Tujuan Dokumen:** Menjelaskan seluruh "pintu masuk" (API) yang menghubungkan aplikasi CutwayWhatsApp — baik untuk digunakan oleh aplikasi web/mobile kita sendiri, maupun untuk diintegrasikan pelanggan ke sistem mereka.
**Catatan:** Dokumen ini berisi **rancangan** API (kontrak antara sistem), bukan kode program.

---

## Apa Itu API? (Untuk yang Belum Familiar)

API (Application Programming Interface) adalah "pintu layanan" yang disediakan sistem CutwayWhatsApp agar aplikasi lain (termasuk aplikasi web kita sendiri) bisa meminta data atau melakukan aksi — misalnya "ambilkan daftar kontak", "kirim pesan ini", atau "buat kampanye baru". Setiap API punya:

- **Alamat (endpoint):** seperti alamat rumah, contoh `/api/v1/contacts`
- **Metode:** jenis aksi — `GET` (ambil data), `POST` (buat data baru), `PATCH` (ubah data), `DELETE` (hapus data)
- **Permintaan (request):** data yang dikirim ke server
- **Balasan (response):** data yang dikembalikan server
- **Otentikasi:** bukti bahwa yang meminta data berhak melakukannya

---

## 1. Prinsip Umum API CutwayWhatsApp

### 1.1 Format Alamat
Semua API menggunakan awalan `/api/v1/...` — angka `v1` menandakan "versi 1". Jika suatu saat API perlu diubah secara besar, kita akan membuat `/api/v2/...` tanpa mematikan `v1` secara mendadak, agar integrasi pelanggan lama tidak rusak.

### 1.2 Cara Otentikasi (Membuktikan Identitas)
Ada dua cara sistem mengenali siapa yang mengakses API:

| Cara | Dipakai Oleh | Bagaimana Kerjanya |
|---|---|---|
| **Token Login (JWT)** | Aplikasi web/mobile CutwayWhatsApp | Setiap permintaan menyertakan `Authorization: Bearer <token>` yang didapat saat login |
| **Kunci API (API Key)** | Sistem pelanggan yang integrasi sendiri | Setiap permintaan menyertakan `X-API-Key: <kunci>` yang dibuat pelanggan di Settings |

Sistem **tidak pernah** mempercayai `organization_id` yang dikirim oleh pengguna — organisasi selalu ditentukan dari token/kunci yang sudah diverifikasi, sehingga satu pelanggan tidak mungkin (secara sengaja maupun tidak sengaja) mengakses data pelanggan lain lewat API.

### 1.3 Format Balasan Jika Terjadi Kesalahan (Error)
Semua API, jika gagal, akan memberi balasan dengan format seragam agar mudah ditangani aplikasi:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Nomor telepon tidak valid",
    "details": [ { "field": "phone_number", "issue": "format_salah" } ],
    "request_id": "req_8f2a..."
  }
}
```

| Kode HTTP | Arti |
|---|---|
| 400 | Data yang dikirim tidak valid |
| 401 | Belum login / token tidak valid |
| 403 | Sudah login, tapi tidak punya izin untuk aksi ini |
| 404 | Data yang dicari tidak ditemukan |
| 409 | Bentrok dengan data yang sudah ada (misal nomor telepon duplikat) |
| 422 | Melanggar aturan bisnis (misal kuota habis) |
| 429 | Terlalu banyak permintaan dalam waktu singkat (rate limit) |
| 500 | Kesalahan di sisi server CutwayWhatsApp |

### 1.4 Batas Kecepatan Permintaan (Rate Limiting)
Untuk menjaga sistem tetap stabil dan adil bagi semua pengguna, setiap jenis akses dibatasi kecepatannya:

| Jenis Akses | Batas |
|---|---|
| Kunci API (API Key) standar | 60 permintaan/menit |
| Sesi aplikasi web (pengguna login) | 300 permintaan/menit |
| Endpoint login/register | 10 permintaan/menit per alamat IP (mencegah percobaan bobol password) |

---

## 2. API Autentikasi

### `POST /api/v1/auth/register` — Daftar Akun Baru
- **Fungsi:** Membuat akun pengguna baru.
- **Kirim:** `{ "email", "password", "full_name" }`
- **Terima:** `{ "user_id", "verification_required": true }`
- **Kesalahan umum:** `409` jika email sudah terdaftar.

### `POST /api/v1/auth/login` — Masuk ke Akun
- **Fungsi:** Login dengan email & password.
- **Kirim:** `{ "email", "password" }`
- **Terima:** `{ "access_token", "refresh_token", "requires_2fa" }`
- **Kesalahan umum:** `401` kredensial salah, `423` akun terkunci sementara (terlalu banyak percobaan gagal).

### `POST /api/v1/auth/2fa/verify` — Verifikasi Dua Langkah
- **Kirim:** `{ "challenge_id", "code" }`
- **Terima:** `{ "access_token", "refresh_token" }`

### `POST /api/v1/auth/refresh` — Perpanjang Sesi
- **Fungsi:** Mendapatkan token akses baru tanpa perlu login ulang.
- **Kirim:** `{ "refresh_token" }`
- **Terima:** `{ "access_token", "refresh_token" }` (token lama otomatis dinonaktifkan)

### `POST /api/v1/auth/logout` — Keluar
- **Fungsi:** Mengakhiri sesi aktif.

### `POST /api/v1/auth/password/forgot` & `POST /api/v1/auth/password/reset`
- **Fungsi:** Alur lupa password standar via email/OTP.

---

## 3. API Organisasi & Anggota Tim

### `GET /api/v1/organizations/current` — Lihat Profil Organisasi
- **Terima:** Data profil organisasi + ringkasan paket langganan aktif.

### `PATCH /api/v1/organizations/current` — Ubah Profil Organisasi
- **Butuh izin:** `org:update`

### `POST /api/v1/organizations/current/members/invite` — Undang Anggota Tim
- **Kirim:** `{ "email", "role_id" }`
- **Kesalahan umum:** `422 SEAT_LIMIT_REACHED` — kuota jumlah pengguna sesuai paket sudah penuh.

### `GET /api/v1/organizations/current/members` — Daftar Anggota Tim
### `PATCH /api/v1/organizations/current/members/{member_id}` — Ubah Peran/Status Anggota
### `DELETE /api/v1/organizations/current/members/{member_id}` — Keluarkan Anggota

---

## 4. API Billing (Pembayaran & Langganan)

### `GET /api/v1/billing/plans` — Lihat Katalog Paket
- **Fungsi:** Menampilkan seluruh paket berbayar yang tersedia (bisa diakses tanpa login, untuk halaman harga publik).

### `POST /api/v1/billing/subscribe` — Berlangganan Paket
- **Kirim:** `{ "plan_id", "payment_method_id", "billing_cycle" }`
- **Terima:** `{ "subscription", "invoice" }`
- **Kesalahan umum:** `402 PAYMENT_FAILED`

### `POST /api/v1/billing/change-plan` — Ganti Paket (Upgrade/Downgrade)
- **Sebaiknya dipanggil setelah:** `GET /billing/change-plan/preview` untuk menampilkan estimasi biaya prorata ke pengguna sebelum konfirmasi.

### `GET /api/v1/billing/invoices` — Riwayat Invoice
### `GET /api/v1/billing/invoices/{id}/pdf` — Unduh Invoice sebagai PDF
### `POST /api/v1/billing/payment-methods` — Tambah Metode Pembayaran
### `POST /api/v1/billing/webhooks/stripe` — (Internal) Penerima notifikasi dari penyedia pembayaran

---

## 5. API Koneksi WhatsApp

### `POST /api/v1/whatsapp/connect/initiate` — Mulai Proses Hubungkan WhatsApp
- **Terima:** `{ "oauth_url" }` — tautan untuk membuka proses otorisasi resmi Meta.

### `POST /api/v1/whatsapp/connect/callback` — Selesaikan Proses Koneksi
- **Fungsi:** Dipanggil otomatis setelah pengguna menyelesaikan otorisasi di Meta, menyimpan data akun WhatsApp Business.

### `GET /api/v1/whatsapp/accounts` — Daftar Nomor WhatsApp Terhubung
- **Terima:** Termasuk status kesehatan setiap nomor (quality rating, tier pengiriman).

### `DELETE /api/v1/whatsapp/accounts/{id}` — Putuskan Koneksi

### `POST /api/v1/webhooks/whatsapp` — (Internal) Penerima Pesan Masuk dari Meta
- **Fungsi:** Alamat yang didaftarkan ke Meta untuk menerima notifikasi pesan masuk & perubahan status pesan. Diverifikasi lewat tanda tangan keamanan (`X-Hub-Signature-256`), bukan token login biasa.

---

## 6. API Inbox & Live Chat

### `GET /api/v1/conversations` — Daftar Percakapan
- **Filter:** status, agen yang ditugaskan, label, halaman, jumlah per halaman.

### `GET /api/v1/conversations/{id}/messages` — Riwayat Pesan dalam Satu Percakapan
- **Filter:** `before` (ambil pesan sebelum waktu tertentu), `limit`.

### `POST /api/v1/conversations/{id}/messages` — Kirim Pesan
- **Kirim:** `{ "type": "text|template|image|...", "content" }`
- **Kesalahan umum:** `422 SESSION_WINDOW_CLOSED` — jendela 24 jam sudah lewat, wajib pakai Template.

### `POST /api/v1/conversations/{id}/assign` — Tugaskan ke Agen
- **Kirim:** `{ "agent_id" }`

### `POST /api/v1/conversations/{id}/notes` — Tambah Catatan Internal
### `PATCH /api/v1/conversations/{id}/status` — Ubah Status Percakapan
- **Kirim:** `{ "status": "resolved|snoozed|open|pending" }`

### `WebSocket /ws/inbox` — Koneksi Real-Time
- **Fungsi:** Memungkinkan tampilan Inbox otomatis diperbarui begitu ada pesan baru, tanpa perlu refresh halaman. Event yang dikirim: `message.new`, `conversation.updated`, `typing.start`.

---

## 7. API Broadcast

### `POST /api/v1/campaigns` — Buat Kampanye Baru
- **Kirim:** `{ "name", "template_id", "segment_id", "scheduled_at", "throttle_per_minute" }`
- **Kesalahan umum:** `422 TEMPLATE_NOT_APPROVED` — template belum disetujui Meta.

### `POST /api/v1/campaigns/{id}/launch` — Luncurkan Kampanye
- **Fungsi:** Melakukan pengecekan akhir (template disetujui, kuota cukup) sebelum mulai mengirim.

### `GET /api/v1/campaigns/{id}/stats` — Statistik Real-Time Kampanye
### `POST /api/v1/campaigns/{id}/cancel` — Batalkan Kampanye
### `GET /api/v1/campaigns/{id}/recipients` — Daftar Penerima & Status Masing-Masing

---

## 8. API Template Pesan

### `POST /api/v1/templates` — Buat & Ajukan Template
- **Fungsi:** Membuat template baru dan otomatis mengirim pengajuan persetujuan ke Meta.

### `GET /api/v1/templates` — Daftar Template
### `GET /api/v1/templates/{id}` — Detail Satu Template
### `DELETE /api/v1/templates/{id}` — Hapus Template
- **Catatan:** Hanya bisa dihapus jika tidak sedang dipakai kampanye aktif.

---

## 9. API CRM

### `GET /api/v1/pipelines` & `POST /api/v1/pipelines` — Lihat/Buat Pipeline
### `GET /api/v1/deals` — Daftar Deal
- **Filter:** pipeline, tahap, pemilik deal.

### `POST /api/v1/deals` — Buat Deal Baru
- **Kirim:** `{ "contact_id", "pipeline_id", "stage_id", "title", "value", "currency" }`

### `PATCH /api/v1/deals/{id}/stage` — Pindahkan Tahap Deal
- **Kirim:** `{ "stage_id" }`
- **Efek samping:** Memicu event `deal.stage_changed` yang bisa dipakai Workflow Automation.

### `POST /api/v1/deals/{id}/activities` — Tambah Aktivitas (Catatan/Panggilan/Tugas)

---

## 10. API Kontak

### `GET /api/v1/contacts` — Daftar Kontak
- **Filter:** kata kunci pencarian, label, segmen, urutan.

### `POST /api/v1/contacts` — Tambah Kontak
- **Kesalahan umum:** `409 DUPLICATE_PHONE`

### `GET /api/v1/contacts/{id}` — Detail Kontak
- **Terima:** Profil lengkap + riwayat percakapan, deal, dan label.

### `PATCH /api/v1/contacts/{id}` — Ubah Data Kontak
### `DELETE /api/v1/contacts/{id}` — Hapus Kontak (soft delete)
### `POST /api/v1/contacts/merge` — Gabungkan Kontak Duplikat
### `POST /api/v1/contacts/import` — Impor Massal dari CSV
- **Terima:** `import_job_id` — status bisa dicek lewat `GET /api/v1/import-jobs/{id}`

### `GET /api/v1/contacts/export` — Ekspor Data Kontak

---

## 11. API Segmen & Label

### `POST /api/v1/segments` — Buat Segmen
- **Kirim:** `{ "name", "type", "rule_logic", "rules" }`

### `GET /api/v1/segments/{id}/preview` — Pratinjau Ukuran Segmen
- **Fungsi:** Menampilkan estimasi jumlah anggota tanpa perlu menyimpan segmen dulu.

### `POST /api/v1/labels` & `POST /api/v1/labels/{id}/assign` — Buat & Terapkan Label

---

## 12. API Workflow Automation

### `GET /api/v1/workflows` — Daftar Workflow
### `POST /api/v1/workflows` — Buat Workflow Baru (kosong, status draft)
### `PUT /api/v1/workflows/{id}/graph` — Simpan Perubahan Diagram
- **Kirim:** `{ "nodes", "edges" }` — dipanggil otomatis setiap kali pengguna mengedit di kanvas (autosave).

### `POST /api/v1/workflows/{id}/publish` — Terbitkan Workflow
- **Fungsi:** Menjadikan versi terbaru sebagai versi yang aktif berjalan.

### `POST /api/v1/workflows/{id}/test-run` — Uji Coba Workflow
- **Kirim:** `{ "sample_trigger_payload" }` — menjalankan simulasi tanpa efek nyata (tidak benar-benar mengirim pesan).

### `GET /api/v1/workflows/{id}/runs` — Riwayat Eksekusi
### `GET /api/v1/workflows/{id}/runs/{run_id}/logs` — Detail Log per Langkah

---

## 13. API AI Agent & Knowledge Base

### `POST /api/v1/ai-agents` — Buat AI Agent
- **Kirim:** `{ "name", "system_prompt", "model_name", "temperature", "kb_collection_ids" }`

### `PATCH /api/v1/ai-agents/{id}` — Ubah Konfigurasi AI Agent
### `POST /api/v1/ai-agents/{id}/test` — Uji Coba AI Agent
- **Kirim:** `{ "message" }` — mensimulasikan respons AI tanpa mengirim ke pelanggan sungguhan.

### `GET /api/v1/ai-agents/{id}/logs` — Riwayat Respons AI (untuk audit & biaya)

### `POST /api/v1/knowledge-base/collections` — Buat Koleksi Pengetahuan
### `POST /api/v1/knowledge-base/documents` — Unggah Dokumen
- **Kirim:** File (PDF/DOCX) atau `{ "source_url" }`
- **Efek:** Memicu proses otomatis di latar belakang (pemecahan teks + pembuatan embedding).

### `GET /api/v1/knowledge-base/documents/{id}` — Cek Status Dokumen
- **Terima:** status `processing` / `ready` / `failed`

---

## 14. API Analitik

### `GET /api/v1/analytics/overview` — Ringkasan Umum
- **Filter:** rentang tanggal.

### `GET /api/v1/analytics/conversations` — Statistik Percakapan
- Volume, waktu respons, tingkat penyelesaian dari waktu ke waktu.

### `GET /api/v1/analytics/campaigns/{id}` — Corong Hasil Kampanye
### `GET /api/v1/analytics/agents` — Papan Peringkat Performa Agen
### `GET /api/v1/analytics/ai` — Statistik AI (tingkat penyelesaian, eskalasi, biaya token)
### `POST /api/v1/analytics/export` — Ekspor Laporan
- **Kirim:** `{ "report_type", "date_from", "date_to", "format": "csv|pdf" }`

---

## 15. API Webhook (Untuk Integrasi Pelanggan)

### `POST /api/v1/webhooks/endpoints` — Daftarkan URL Penerima Event
- **Kirim:** `{ "url", "subscribed_events": ["message.received", "campaign.completed"] }`
- **Terima:** Termasuk `secret` yang hanya ditampilkan satu kali — dipakai pelanggan untuk memverifikasi keaslian data yang diterima.

### `GET /api/v1/webhooks/endpoints` — Daftar Endpoint Terdaftar
### `GET /api/v1/webhooks/endpoints/{id}/deliveries` — Riwayat Pengiriman Event
### `POST /api/v1/webhooks/endpoints/{id}/deliveries/{delivery_id}/redeliver` — Kirim Ulang Event yang Gagal

---

## 16. API Pengaturan (Settings)

### `GET/PATCH /api/v1/settings/business-hours` — Jam Operasional
### `GET/PATCH /api/v1/settings/auto-reply` — Balasan Otomatis di Luar Jam Kerja
### `GET/PATCH /api/v1/settings/branding` — Kustomisasi Tampilan (khusus paket Enterprise, white-label)

---

## 17. API Admin (Khusus Tim Internal CutwayWhatsApp)

API ini **tidak untuk pelanggan** — hanya bisa diakses oleh staf internal CutwayWhatsApp yang memiliki akses `is_platform_admin`.

### `GET /api/v1/admin/organizations` — Daftar Seluruh Pelanggan (Tenant)
### `PATCH /api/v1/admin/organizations/{id}/suspend` — Bekukan Akun Pelanggan
### `GET /api/v1/admin/system/health` — Kesehatan Sistem Secara Keseluruhan
- Kedalaman antrean job, keterlambatan replika database, tingkat kegagalan webhook.

### `GET /api/v1/admin/system/audit-logs` — Pencarian Audit Log Lintas Pelanggan
- **Fungsi:** Investigasi masalah kepatuhan/keamanan yang melibatkan lebih dari satu pelanggan.

### `POST /api/v1/admin/plans` — Kelola Katalog Paket

---

## 18. Contoh Alur Penggunaan API (Skenario Nyata)

Agar lebih mudah dibayangkan, berikut satu contoh skenario penggunaan API dari awal sampai akhir — seorang pelanggan mengintegrasikan sistem toko online mereka sendiri ke CutwayWhatsApp:

```
1. Pelanggan membuat API Key di Settings → POST /api/v1/settings (menghasilkan kunci)
2. Sistem toko online pelanggan memanggil:
   POST /api/v1/contacts  → menambahkan pembeli baru sebagai kontak
3. Saat ada pesanan baru, sistem toko memanggil:
   POST /api/v1/conversations/{id}/messages → mengirim notifikasi status pesanan via WhatsApp
4. Pelanggan mendaftarkan webhook:
   POST /api/v1/webhooks/endpoints → agar setiap kali ada balasan dari pembeli,
   sistem toko otomatis menerima notifikasi tanpa harus terus-menerus mengecek manual
5. CutwayWhatsApp mengirim event ke URL pelanggan setiap ada pesan baru,
   ditandatangani dengan secret agar pelanggan yakin data itu asli dari CutwayWhatsApp
```

---

## Penutup

Dokumen ini mencakup seluruh kontrak API yang menjadi jembatan antara data (Artefak 01) dan aksi yang bisa dilakukan pengguna maupun sistem pihak ketiga. Setiap endpoint dirancang mengikuti pola yang konsisten agar mudah dipelajari developer dan aman digunakan pelanggan. Detail teknis final (skema OpenAPI/Swagger lengkap dengan semua kombinasi parameter) akan dihasilkan sebagai dokumen turunan saat tim engineering mulai implementasi, mengacu pada rancangan di dokumen ini.
