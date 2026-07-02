# ARTEFAK 03 — ARSITEKTUR SISTEM, TEKNOLOGI & UI/UX CUTWAYWHATSAPP

**Untuk:** Product Owner / Founder CutwayWhatsApp
**Tujuan Dokumen:** Menjelaskan bagaimana seluruh komponen teknis CutwayWhatsApp saling terhubung, teknologi apa yang dipakai dan mengapa, serta bagaimana setiap halaman aplikasi dirancang dari sisi pengguna.

---

## BAGIAN A — ARSITEKTUR SISTEM

## 1. Gambaran Umum Arsitektur

CutwayWhatsApp dibangun dengan pendekatan **"Modular Monolith"** — sebuah istilah yang sekilas terdengar rumit, tapi maknanya sederhana:

> Bayangkan sebuah **ruko dengan banyak kios di dalamnya** (modular), tapi dikelola dalam **satu bangunan dan satu manajemen** (monolith). Setiap kios (modul: Inbox, Broadcast, CRM, dll.) punya batasan yang jelas dan bisa berdiri sendiri secara logika, tapi mereka semua berbagi satu gedung yang sama sehingga lebih murah dibangun dan dirawat di tahap awal.

Jika di masa depan satu kios (misalnya modul AI Agent) menjadi sangat ramai dan butuh "bangunan sendiri" karena traffic-nya sangat tinggi, ia bisa "pindah rumah" menjadi layanan terpisah **tanpa perlu membongkar seluruh ruko** — karena sejak awal batas antar kios sudah jelas.

### 1.1 Diagram Alur Sistem Secara Sederhana

```
                    Pengguna (Browser / HP)
                              │
                    ┌─────────▼─────────┐
                    │  CDN + Keamanan    │   ← Melindungi dari serangan, mempercepat loading
                    │  (Cloudflare)      │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Pintu Gerbang     │   ← Mengatur lalu lintas permintaan masuk
                    │  (NGINX)           │
                    └───┬─────────────┬──┘
                        │             │
              ┌─────────▼──┐   ┌──────▼────────┐
              │  Tampilan   │   │   Otak Sistem  │   ← Tempat seluruh logika bisnis berjalan
              │  Aplikasi   │   │   (Backend API)│
              │  (Frontend) │   └───┬───────┬────┘
              └─────────────┘       │       │
                        ┌────────────▼─┐  ┌──▼─────────────┐
                        │  Database     │  │  Pekerja Latar  │  ← Proses yang butuh waktu lama
                        │  (PostgreSQL) │  │  Belakang       │     (kirim broadcast, proses AI, dll)
                        └───────────────┘  └─────────────────┘
                                                    │
                                        ┌───────────▼────────────┐
                                        │  Layanan Luar            │
                                        │  WhatsApp, Pembayaran,   │
                                        │  AI (Anthropic), Email   │
                                        └──────────────────────────┘
```

### 1.2 Mengapa Desain Ini Dipilih (Bukan yang Lain)?

| Alternatif yang Tidak Dipilih | Alasan Tidak Dipilih di Tahap Awal |
|---|---|
| Microservices penuh sejak awal (setiap modul = aplikasi terpisah) | Terlalu kompleks dan mahal untuk tim kecil di tahap awal — butuh banyak infrastruktur tambahan yang belum diperlukan saat pengguna masih sedikit |
| Monolith murni (semua kode tercampur tanpa batas modul) | Sulit dirawat jangka panjang, sulit diserahkan ke tim yang lebih besar nanti, sulit dipecah jika satu bagian butuh skala berbeda |
| **Modular Monolith (dipilih)** | Cepat dibangun, murah dioperasikan di awal, tapi tetap punya "garis batas" jelas antar modul sehingga bisa dipecah jadi microservices di kemudian hari **hanya pada bagian yang benar-benar membutuhkannya** |

### 1.3 Prinsip Dasar yang Dipegang

1. **Semua layanan bisa "digandakan" dengan mudah (stateless):** Server aplikasi tidak menyimpan data sesi pengguna di memorinya sendiri — semua status disimpan di Redis/database. Ini artinya jika pengguna tiba-tiba melonjak, kita tinggal menambah jumlah server tanpa masalah.
2. **Komunikasi antar modul lewat "pesan", bukan panggilan langsung, untuk hal yang tidak butuh jawaban seketika:** Misalnya saat ada pesan WhatsApp masuk, modul Inbox tidak "menunggu" modul AI Agent selesai memproses — ia hanya "mengirim pesan" ke antrean, dan modul AI Agent memprosesnya secara terpisah. Ini membuat sistem tidak mudah macet jika satu bagian sedang lambat.
3. **Setiap wilayah bisnis (region) bisa dijalankan terpisah** jika dibutuhkan kepatuhan data (misalnya pelanggan Pemerintah yang datanya wajib berada di dalam negeri).

---

## 2. Teknologi yang Digunakan & Alasan Pemilihannya

| Bagian Sistem | Teknologi | Alasan Bisnis (Bukan Hanya Teknis) |
|---|---|---|
| Tampilan Aplikasi (Frontend) | Next.js (React) | Ekosistem developer sangat besar di Indonesia dan dunia — mudah merekrut talenta, dan mendukung tampilan cepat baik di web maupun bisa dikembangkan ke arah mobile |
| Kanvas Workflow Builder | React Flow | Pustaka matang khusus untuk membuat editor diagram drag-and-drop seperti n8n — tidak perlu membangun dari nol |
| Otak Sistem (Backend) | Node.js + NestJS | Bahasa yang sama dipakai di frontend (JavaScript/TypeScript), mempermudah tim kecil mengerjakan keduanya; NestJS memberi struktur rapi yang mencegah kode menjadi kacau seiring bertambahnya modul |
| Database Utama | PostgreSQL | Dijelaskan detail alasannya di Artefak 01 |
| Antrean & Cache | Redis + BullMQ | Standar industri untuk memproses tugas latar belakang (broadcast, AI, webhook) secara andal dan bisa diatur kecepatannya |
| Penyimpanan File | S3-compatible (AWS S3 / MinIO) | Media, backup, dan file ekspor disimpan terpisah dari database agar keduanya tetap ringan dan cepat |
| CDN & Keamanan Depan | Cloudflare | Melindungi dari serangan (DDoS), mempercepat pemuatan halaman di seluruh dunia |
| Koneksi WhatsApp | WhatsApp Cloud API (Meta) / BSP (360dialog, Twilio) | Dibungkus lewat lapisan adapter agar CutwayWhatsApp tidak terikat mati ke satu penyedia — bisa berpindah/menambah penyedia lain tanpa mengubah seluruh sistem |
| Penyedia AI | Anthropic Claude (utama), dengan lapisan adapter untuk provider lain | Sama seperti WhatsApp API, dibungkus adapter agar tidak terkunci ke satu vendor AI saja |
| Kontainer Aplikasi | Docker | Memastikan aplikasi berjalan sama persis di laptop developer, server uji coba, maupun server produksi — mengurangi masalah "kok di komputer saya jalan tapi di server tidak" |
| Orkestrasi Server | Kubernetes | Mengelola banyak "salinan" aplikasi secara otomatis — menambah kapasitas saat ramai, memulihkan diri sendiri saat ada bagian yang error |
| Otomasi Deploy | GitHub Actions + ArgoCD | Setiap perubahan kode yang sudah disetujui bisa otomatis diuji dan diluncurkan ke server tanpa campur tangan manual yang berisiko human error |
| Pemantauan Sistem | Prometheus, Grafana, Sentry | Memberi "dashboard kesehatan" real-time ke tim engineering, agar masalah bisa terdeteksi sebelum pelanggan komplain |

**Poin penting untuk Product Owner:** Setiap pilihan teknologi di atas sudah **matang dan digunakan luas oleh perusahaan besar dunia** (bukan teknologi eksperimental) — ini mengurangi risiko proyek dan memudahkan proses rekrutmen talenta engineering di masa depan.

---

## 3. Struktur Kode (Gambaran Tingkat Tinggi)

Untuk memberi gambaran bagaimana kode program akan diorganisir (tanpa perlu memahami detail teknisnya), berikut analoginya:

**Backend (Otak Sistem)** diatur seperti **lemari arsip kantor** — setiap laci (modul) punya nama jelas: `auth/` (login), `contacts/` (kontak), `broadcast/` (kampanye), `workflows/` (otomasi), `ai-agent/` (AI), dan seterusnya, mengikuti 30 modul yang sudah dirancang. Di dalam setiap laci, selalu ada susunan yang sama: aturan penerimaan permintaan, logika bisnis, dan cara mengambil/menyimpan data — sehingga developer baru yang bergabung ke tim bisa cepat memahami pola kerja sistem tanpa harus belajar dari nol di setiap modul.

**Frontend (Tampilan Aplikasi)** diatur berdasarkan halaman yang dilihat pengguna: `dashboard/`, `inbox/`, `broadcast/`, `workflows/builder/`, `crm/`, `contacts/`, `analytics/`, `settings/`, `billing/` — setiap folder berisi seluruh tampilan dan komponen visual khusus untuk halaman tersebut.

**Aturan Emas:** Satu modul **tidak boleh langsung "mencampuri urusan" modul lain**. Misalnya, modul Inbox tidak langsung memanggil kode modul Workflow — ia hanya "mengumumkan" bahwa ada pesan baru, dan modul Workflow yang memutuskan sendiri apakah ingin bereaksi. Aturan ini menjaga sistem tetap rapi meskipun terus bertambah fitur baru selama bertahun-tahun.

---

## BAGIAN B — DESAIN UI/UX (ANTARMUKA PENGGUNA)

## 4. Filosofi Desain

CutwayWhatsApp dirancang untuk bisa dipakai oleh **spektrum pengguna yang sangat luas** — dari pemilik UMKM yang baru pertama kali pakai software bisnis, sampai tim IT Enterprise/Government yang terbiasa dengan sistem kompleks. Prinsip desainnya:

1. **Sederhana di permukaan, kuat di kedalaman** — fitur dasar (kirim pesan, lihat kontak) harus terasa semudah aplikasi chat biasa; fitur lanjutan (workflow, AI) baru terlihat saat dibutuhkan.
2. **Konsisten di setiap halaman** — pola navigasi, warna status, dan bahasa yang dipakai (misalnya penamaan tombol) seragam di seluruh aplikasi.
3. **Responsif** — tampilan menyesuaikan baik di layar besar (laptop admin/agen) maupun layar kecil (HP agen lapangan atau pemilik UMKM yang memantau bisnis dari HP).

## 5. Struktur Tata Letak Umum (Layout)

Setiap halaman aplikasi berbagi kerangka yang sama:

- **Sidebar Kiri (Menu Utama):** Dashboard, Inbox, Broadcast, Workflow, CRM, Kontak, Analitik, Pengaturan, Billing. Bisa diciutkan agar layar lebih luas. Di HP, menu ini berubah jadi tab bawah.
- **Bar Atas:** Pengalih organisasi (jika satu pengguna gabung di banyak organisasi), lonceng notifikasi, status agen (online/away), menu akun.
- **Area Konten Utama:** Berubah sesuai halaman yang dipilih.

## 6. Rincian Desain per Halaman

### 6.1 Landing Page (Halaman Depan Publik)
**Tujuan:** Meyakinkan pengunjung untuk mendaftar.
**Isi:** Bagian hero dengan tombol "Mulai Gratis", daftar fitur unggulan (Inbox, Broadcast, AI Agent, Workflow), tabel perbandingan paket harga, testimoni pelanggan, lencana mitra resmi WhatsApp Cloud API.

### 6.2 Halaman Daftar / Masuk
**Isi:** Formulir email/password, tombol masuk lewat Google/Microsoft (khusus Enterprise), indikator kekuatan password, layar verifikasi kode OTP untuk 2FA.

### 6.3 Dashboard (Halaman Utama Setelah Login)
**Tujuan:** Memberi gambaran cepat kesehatan bisnis dalam satu layar.
**Isi:** Kartu ringkasan "Percakapan Hari Ini", grafik perbandingan Selesai vs Belum Selesai, grafik performa 5 kampanye terakhir, indikator pemakaian kuota paket (pesan, jumlah pengguna, token AI), tombol aksi cepat (Buat Broadcast Baru, Undang Tim, Hubungkan WhatsApp).
**Filter:** Pemilih rentang tanggal (hari ini/7 hari/30 hari/kustom).

### 6.4 Inbox (Ruang Kerja Agen)
**Tujuan:** Tempat agen menangani percakapan pelanggan sehari-hari — halaman yang paling sering dipakai di seluruh aplikasi.
**Tata Letak 3 Kolom:** Daftar percakapan (kiri) → isi obrolan aktif (tengah) → panel info kontak & CRM (kanan, bisa disembunyikan di tablet/HP).
**Isi:** Tab filter (Semua/Punya Saya/Belum Ditugaskan/Selesai), pencarian, chip filter label, gelembung pesan dengan tanda status (terkirim/diterima/dibaca), kotak balas dengan pemilih template + lampiran media + perintah cepat balasan siap pakai, tombol tugaskan agen, penanda batas waktu SLA.
**Di HP:** Tampilan menciut jadi satu kolom, berpindah antara daftar → obrolan → info dengan tombol kembali.

### 6.5 Broadcast (Kampanye)
**Isi:** Tabel daftar kampanye (nama, status, jumlah terkirim/terbaca), wizard "Kampanye Baru" 4 langkah (1. Pilih audiens/segmen dengan pratinjau jumlah langsung, 2. Pilih template & isi variabel, 3. Atur jadwal & kecepatan kirim, 4. Tinjau & Luncurkan), halaman detail kampanye dengan grafik corong real-time (terkirim → diterima → dibaca → dibalas) dan tabel penerima gagal dengan tombol kirim ulang.

### 6.6 Workflow Builder (Editor Otomasi)
**Tata Letak:** Panel kiri berisi daftar node yang bisa diseret (Trigger/Kondisi/Aksi), kanvas tengah tempat menyusun diagram, panel kanan berisi pengaturan node yang sedang dipilih, laci bawah untuk log eksekusi/hasil uji coba.
**Isi:** Kartu node yang bisa diseret-lepas, garis penghubung dengan label kondisi pada percabangan, peta mini, kontrol zoom, tombol "Simpan Draft" vs "Terbitkan", dropdown riwayat versi.

### 6.7 CRM
**Isi:** Papan Kanban (kolom = tahapan pipeline, kartu bisa diseret antar tahap), kartu deal (foto kontak, nilai transaksi, lama waktu di tahap ini), panel detail deal (linimasa aktivitas, percakapan terhubung), pemilih pipeline, tombol tambah deal cepat.

### 6.8 Kontak
**Isi:** Tabel data (nama, telepon, terakhir dihubungi, label, status opt-in), toolbar aksi massal (beri label, ekspor, hapus, masukkan ke segmen), panel detail kontak (profil, kolom kustom, riwayat percakapan & deal), wizard "Impor Kontak" (unggah → pemetaan kolom → strategi hindari duplikat → konfirmasi).

### 6.9 Analitik
**Isi:** Navigasi tab (Ringkasan / Percakapan / Kampanye / Agen / AI), pemilih rentang tanggal, grafik yang bisa diekspor, papan peringkat performa agen, indikator tingkat penyelesaian AI, dialog "Jadwalkan Laporan Email".

### 6.10 Pengaturan
**Isi:** Navigasi bagian (Profil Organisasi, Jam Operasional, Koneksi WhatsApp, Pengguna & Peran, Notifikasi, Kunci API, Webhook, Branding [Enterprise], Data & Privasi). Setiap bagian punya formulirnya sendiri, kartu koneksi WhatsApp dengan status kesehatan, editor matriks peran/izin akses berbasis kotak centang.

### 6.11 Billing
**Isi:** Kartu paket aktif dengan indikator pemakaian, tabel perbandingan paket untuk upgrade, daftar metode pembayaran + dialog tambah kartu, tabel riwayat invoice dengan tombol unduh PDF, banner peringatan jika pembayaran gagal.

### 6.12 Admin Dashboard (Khusus Tim Internal CutwayWhatsApp)
**Tujuan:** Konsol operasional internal untuk tim CutwayWhatsApp sendiri (bukan pelanggan).
**Isi:** Tabel seluruh pelanggan (cari, filter berdasarkan tier/status/pendapatan), detail satu pelanggan (pemakaian, kesehatan akun, catatan support), panel kesehatan sistem (kedalaman antrean, tingkat kegagalan webhook, keterlambatan database), fitur "impersonate" (masuk sebagai pelanggan untuk bantu troubleshooting, tercatat ketat di audit log), kelola paket/kupon.

---

## 7. Prinsip Aksesibilitas & Kenyamanan Pengguna

- **Konsistensi warna status:** Hijau = berhasil/aktif, Kuning = perlu perhatian, Merah = gagal/bermasalah — dipakai seragam di seluruh aplikasi (status kualitas nomor WhatsApp, status pengiriman pesan, status kampanye, dll.) agar pengguna tidak perlu belajar ulang di setiap halaman.
- **Konfirmasi untuk aksi berisiko:** Setiap aksi yang tidak bisa dibatalkan (hapus kontak, hapus workflow, keluarkan anggota tim) selalu menampilkan dialog konfirmasi.
- **Umpan balik instan:** Setiap aksi (simpan, kirim, hapus) memberi tanda visual jelas bahwa aksi sedang diproses dan sudah selesai — mengurangi kebingungan "apakah tombolnya sudah kepencet".

---

## Penutup

Dokumen ini menjelaskan **dua sisi mata uang** dari CutwayWhatsApp: bagaimana sistem bekerja "di belakang layar" (arsitektur, teknologi, struktur kode) dan bagaimana pengguna akan berinteraksi "di depan layar" (desain setiap halaman). Keduanya dirancang saling mendukung — arsitektur modular yang rapi memungkinkan setiap halaman UI bisa dikembangkan secara independen oleh tim yang berbeda tanpa saling mengganggu, sementara desain UI yang konsisten memastikan pengguna merasa berada dalam satu produk yang koheren, bukan kumpulan fitur yang terpisah-pisah.
