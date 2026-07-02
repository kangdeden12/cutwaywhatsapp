# ARTEFAK 05 — KEAMANAN, INFRASTRUKTUR/DEVOPS, SKALABILITAS, TESTING & ROADMAP CUTWAYWHATSAPP

**Untuk:** Product Owner / Founder CutwayWhatsApp
**Tujuan Dokumen:** Menjelaskan bagaimana CutwayWhatsApp dijaga tetap aman, bagaimana sistem dijalankan dan dirawat di server, bagaimana kualitasnya diuji, dan rencana pengembangan dari sekarang sampai peluncuran penuh.

---

## BAGIAN A — KEAMANAN (SECURITY)

## 1. Mengapa Keamanan Menjadi Prioritas Tertinggi

CutwayWhatsApp menyimpan data yang sangat sensitif: percakapan pelanggan, nomor telepon, data pembayaran, dan strategi bisnis (lewat data CRM). Jika terjadi kebocoran data, dampaknya bukan hanya teknis — bisa merusak kepercayaan pelanggan secara permanen dan menimbulkan masalah hukum. Karena itu, keamanan dirancang berlapis-lapis (defense in depth) — bukan mengandalkan satu benteng saja.

## 2. Keamanan Identitas & Akses Masuk

| Perlindungan | Penjelasan Sederhana |
|---|---|
| **Password terenkripsi** | Password pengguna tidak pernah disimpan dalam bentuk asli — hanya versi "acak yang tidak bisa dibalikkan" (hash Argon2id) yang disimpan. Bahkan tim internal CutwayWhatsApp tidak bisa melihat password asli pengguna. |
| **Token akses berumur pendek** | Token login (JWT) hanya berlaku 15 menit, lalu diperbarui otomatis lewat "tiket perpanjangan" (refresh token) — mengurangi risiko jika satu token bocor. |
| **Deteksi pencurian sesi** | Jika sistem mendeteksi "tiket perpanjangan" yang sudah dipakai dipakai lagi (tanda-tanda pencurian), seluruh sesi terkait langsung dibatalkan otomatis sebagai tindakan pencegahan. |
| **Verifikasi Dua Langkah (2FA)** | Wajib untuk pemilik akun (Owner) dan Admin di paket Enterprise/Government — kode tambahan dari aplikasi otentikator selain password. |
| **RBAC (Role-Based Access Control)** | Setiap pengguna hanya bisa melakukan hal-hal yang diizinkan sesuai perannya (Owner, Admin, Agent, dst.) — dijelaskan detail di Artefak 01. |
| **Manajemen Sesi/Perangkat** | Pengguna bisa melihat dan mencabut akses dari perangkat mana pun secara mandiri lewat Pengaturan. |

## 3. Keamanan Data

| Perlindungan | Penjelasan Sederhana |
|---|---|
| **Enkripsi saat data berpindah (in transit)** | Semua komunikasi antara browser pengguna dan server dilindungi TLS (gembok HTTPS) — data tidak bisa "diintip" saat melintas di internet. |
| **Enkripsi saat data disimpan (at rest)** | Data di database dan penyimpanan file dienkripsi, sehingga jika media penyimpanan fisik dicuri sekalipun, data tetap tidak terbaca. |
| **Enkripsi khusus data super-sensitif** | Token akses WhatsApp, kunci rahasia webhook, dan data 2FA mendapat lapisan enkripsi tambahan di level kolom, terpisah dari enkripsi umum. |
| **Tidak ada rahasia tersimpan di kode program** | Semua kunci rahasia (password database, kunci API pihak ketiga) disimpan di sistem brankas digital terpisah (Vault/Secrets Manager), bukan tertulis di dalam kode. |
| **Minimasi data pribadi** | Data yang sudah tidak relevan dihapus otomatis sesuai kebijakan retensi (lihat Artefak 01, Soft Delete), mendukung permintaan hapus data dari pelanggan sesuai regulasi privasi. |

## 4. Keamanan Aplikasi

| Perlindungan | Penjelasan Sederhana |
|---|---|
| **Validasi input ketat** | Setiap data yang dikirim ke sistem diperiksa formatnya sebelum diproses — mencegah data "sampah" atau berbahaya masuk ke sistem. |
| **Pembatasan kecepatan (rate limiting)** | Mencegah percobaan bobol password bertubi-tubi atau penyalahgunaan API secara masif. |
| **Kunci API yang bisa dibatasi & dicabut** | Setiap kunci API yang dibuat pelanggan bisa dibatasi haknya (misalnya hanya boleh baca data, tidak boleh kirim broadcast) dan bisa dicabut kapan saja. |
| **Verifikasi keaslian pesan dari Meta/WhatsApp** | Setiap notifikasi masuk dari WhatsApp diverifikasi tanda tangan digitalnya, memastikan data benar-benar berasal dari Meta, bukan pihak yang menyamar. |
| **Pemindaian celah keamanan otomatis** | Setiap kali ada pembaruan kode, sistem otomatis memindai apakah ada komponen pihak ketiga yang punya celah keamanan yang diketahui publik. |

## 5. Pemantauan & Respons Insiden

- **Log tersusun rapi dan tersaring dari data sensitif** — aktivitas sistem dicatat untuk investigasi, tapi tidak pernah menyimpan password atau data pribadi mentah di dalam log.
- **Pemantauan otomatis 24 jam** — tim engineering mendapat notifikasi otomatis jika ada aktivitas mencurigakan (misalnya lonjakan percobaan login gagal) atau performa sistem menurun drastis.
- **Cadangan data (backup) berlapis** — dijelaskan detail di Artefak 01 (Bagian Backup).
- **Prosedur tanggap darurat terdokumentasi** — jika terjadi insiden keamanan, tim mengikuti langkah baku yang sudah disiapkan sebelumnya, bukan improvisasi di tengah krisis.

## 6. Tingkat Keamanan Berdasarkan Tier Pelanggan

| Tier Pelanggan | Perlindungan Tambahan |
|---|---|
| Semua pelanggan | Enkripsi menyeluruh, RBAC, audit log, kunci rahasia terenkripsi |
| Enterprise | Login SSO (satu akun perusahaan untuk banyak layanan), peran akses kustom, pembatasan akses berdasarkan alamat IP kantor |
| Government | Data disimpan di wilayah/server tertentu sesuai regulasi negara, retensi audit log lebih panjang, audit log dengan sistem anti-rekayasa, 2FA wajib untuk semua pengguna |

---

## BAGIAN B — INFRASTRUKTUR & DEVOPS

## 7. Bagaimana Sistem Dijalankan di Server

CutwayWhatsApp dijalankan menggunakan pendekatan **kontainer** — bayangkan setiap bagian aplikasi (tampilan, otak sistem, pekerja latar belakang) "dikemas" dalam kotak standar yang bisa dijalankan di mana saja tanpa masalah kompatibilitas. Kotak-kotak ini diatur secara otomatis oleh sistem bernama **Kubernetes**, yang bertugas seperti "manajer operasional otomatis":

- Jika satu kotak (server) tiba-tiba mati/error, Kubernetes otomatis menggantinya dengan yang baru — **tanpa campur tangan manusia**, sehingga pengguna hampir tidak akan menyadari ada gangguan.
- Jika jumlah pengguna melonjak (misalnya saat kampanye besar dikirim), Kubernetes otomatis menambah jumlah "kotak" yang berjalan untuk menangani beban tambahan tersebut, lalu menguranginya kembali saat beban mereda — sehingga biaya server efisien.

## 8. Lingkungan Terpisah untuk Pengembangan yang Aman

Ada tiga "dunia" terpisah tempat kode CutwayWhatsApp berjalan:

| Lingkungan | Fungsi |
|---|---|
| **Development (dev)** | Tempat developer menguji fitur baru yang sedang dikerjakan |
| **Staging** | Salinan hampir identik dengan sistem nyata, dipakai untuk uji coba menyeluruh sebelum fitur dirilis ke pengguna sungguhan |
| **Production** | Sistem nyata yang dipakai pelanggan sehari-hari |

Pemisahan ini memastikan **kesalahan saat pengembangan tidak pernah langsung berdampak ke pelanggan** — setiap perubahan harus "lulus ujian" di dua lingkungan sebelumnya.

## 9. Proses Rilis Fitur Baru (CI/CD) — Otomatis dan Aman

```
Developer menyelesaikan kode fitur baru
   ↓
Sistem otomatis menjalankan serangkaian pemeriksaan:
   1. Memeriksa apakah kode ditulis dengan rapi (lint)
   2. Menjalankan ratusan uji otomatis untuk memastikan fitur bekerja benar
   3. Membangun "kotak" aplikasi versi baru
   4. Memindai apakah ada celah keamanan
   ↓
Jika semua pemeriksaan lolos → otomatis diluncurkan ke lingkungan Staging
   ↓
Uji coba menyeluruh dijalankan di Staging (mensimulasikan perjalanan pengguna nyata)
   ↓
Perlu persetujuan manual dari tim → baru diluncurkan ke Production
   ↓
Peluncuran dilakukan bertahap (10% pengguna dulu → 50% → 100%),
dan jika terdeteksi ada masalah, sistem otomatis "mundur" ke versi sebelumnya
tanpa menunggu perintah manual
```

**Manfaat bagi bisnis:** Proses ini membuat CutwayWhatsApp bisa merilis pembaruan/fitur baru **sering dan cepat**, tanpa mengorbankan stabilitas — karena setiap risiko sudah diminimalkan lewat pemeriksaan otomatis berlapis, bukan mengandalkan ketelitian manual semata.

## 10. Pemantauan Kesehatan Sistem

Tim engineering memiliki "ruang kendali" digital yang menampilkan kondisi sistem secara real-time: kecepatan respons aplikasi, jumlah kesalahan yang terjadi, seberapa penuh antrean tugas latar belakang (misalnya antrean pengiriman broadcast), dan kondisi database. Jika ada angka yang keluar dari batas normal, tim otomatis mendapat notifikasi — sering kali **sebelum pelanggan menyadari ada masalah**.

---

## BAGIAN C — STRATEGI SKALABILITAS

## 11. Bagaimana Sistem Tetap Cepat Saat Pengguna Bertambah Banyak

| Strategi | Analogi Sederhana |
|---|---|
| Menambah jumlah "kotak" aplikasi secara otomatis | Seperti menambah kasir di supermarket saat antrean panjang, dan menguranginya saat sepi |
| Partisi tabel database besar per bulan | Seperti menyimpan arsip per bulan dalam kardus terpisah, bukan satu kardus raksasa yang terus menumpuk (detail di Artefak 01) |
| Salinan database khusus untuk laporan (read replica) | Seperti punya fotokopi buku besar khusus untuk tim akunting menghitung, agar tidak mengganggu kasir yang sedang melayani transaksi baru |
| Penyimpanan sementara cepat (cache) | Seperti menyimpan catatan harga di meja kasir untuk barang yang sering ditanyakan, alih-alih bolak-balik ke gudang setiap kali |
| Batas kecepatan pengiriman per nomor WhatsApp | Mencegah satu nomor WhatsApp "kebanjiran" kirim pesan melebihi izin resmi dari Meta, yang bisa berakibat nomor diblokir |
| Pemisahan tenant besar ke database sendiri | Untuk pelanggan Enterprise/Government yang sangat besar, data mereka bisa "dipindah rumah" ke server terpisah agar tidak memengaruhi performa pelanggan lain |

**Poin penting:** Karena fondasi database dan arsitektur sudah dirancang matang sejak awal (lihat Artefak 01 & 03), setiap langkah peningkatan skala ini **bisa dilakukan bertahap sesuai kebutuhan nyata** — CutwayWhatsApp tidak perlu membangun infrastruktur "raksasa" sejak hari pertama, cukup menyesuaikan seiring pertumbuhan jumlah pelanggan.

---

## BAGIAN D — STRATEGI PENGUJIAN (TESTING)

## 12. Mengapa Pengujian Otomatis Penting

Setiap fitur baru berpotensi "merusak" fitur lama yang sudah berjalan baik jika tidak diuji dengan benar. CutwayWhatsApp mengandalkan **pengujian otomatis** (bukan hanya manual) agar setiap perubahan kode bisa diverifikasi dengan cepat dan konsisten, ribuan kali tanpa lelah — sesuatu yang tidak mungkin dilakukan tim QA manual sendirian di setiap rilis.

## 13. Lapisan-Lapisan Pengujian

| Jenis Pengujian | Yang Diperiksa |
|---|---|
| **Uji Unit** | Bagian terkecil dari logika program (misalnya "apakah perhitungan diskon sudah benar") |
| **Uji Integrasi** | Apakah beberapa bagian sistem bekerja benar saat digabungkan (misalnya menyimpan data ke database sungguhan) |
| **Uji Perjalanan Pengguna (End-to-End)** | Mensimulasikan pengguna sungguhan: daftar → berlangganan → hubungkan WhatsApp → kirim pesan, dari awal sampai akhir |
| **Uji Beban (Load Test)** | Mensimulasikan ribuan pengguna/pesan sekaligus untuk memastikan sistem tetap stabil saat ramai |
| **Uji Keamanan** | Mencoba "menyerang" sistem sendiri secara terkendali untuk menemukan celah sebelum ditemukan pihak yang tidak bertanggung jawab |
| **Uji Kualitas Jawaban AI** | Menjalankan sekumpulan pertanyaan contoh terhadap AI Agent setiap kali ada perubahan konfigurasi, memastikan kualitas jawaban tidak menurun |

## 14. Pengujian Khusus: Isolasi Data Antar Pelanggan

Ini adalah **pengujian wajib yang paling penting** secara bisnis — sistem otomatis mencoba (dengan sengaja) mengakses data satu organisasi menggunakan kredensial organisasi lain, dan memastikan sistem **selalu menolak** akses tersebut. Pengujian ini dijalankan setiap kali ada perubahan kode, tanpa kecuali, karena kegagalan di area ini adalah risiko bisnis paling fatal bagi platform multi-tenant seperti CutwayWhatsApp.

---

## BAGIAN E — ROADMAP PENGEMBANGAN

## 15. Tahapan Pengembangan

### Tahap 0 — Fondasi (Minggu 1–4)
Menyiapkan infrastruktur dasar, sistem login & keamanan, struktur organisasi/pengguna/peran, struktur database inti, dan sistem desain tampilan (design system).

### Tahap 1 — Inti Perpesanan / MVP (Minggu 5–12)
Koneksi WhatsApp, Inbox, Live Chat, Kontak, Label, Template Pesan, notifikasi dasar, langganan & pembayaran (satu penyedia dulu), Dashboard versi 1.
**Target Tonggak:** Pelanggan bisa mendaftar, menghubungkan nomor WhatsApp, dan melakukan percakapan dua arah.

### Tahap 2 — Fitur Pertumbuhan (Minggu 13–20)
Broadcast, Segmen, CRM (Pipeline/Deal), Impor/Ekspor, Pustaka Media, Analitik versi 1, Webhook (masuk/keluar), REST API + Kunci API, Kolaborasi Tim.
**Target Tonggak:** Pelanggan bisa menjalankan kampanye broadcast bertarget dan mengelola alur penjualan.

### Tahap 3 — Otomasi & AI (Minggu 21–30)
Mesin & editor Workflow Automation, modul AI Agent, Knowledge Base + RAG, log & kontrol biaya AI, Analitik versi 2 (performa AI & agen).
**Target Tonggak:** Pelanggan bisa mengaktifkan AI Agent yang menjawab dari basis pengetahuan mereka sendiri, plus membangun otomasi tanpa kode.

### Tahap 4 — Kesiapan Enterprise & Penguatan Skala (Minggu 31–38)
Login SSO, peran akses kustom, branding white-label, jalur deployment tenant khusus, audit log anti-rekayasa, pembatasan akses lanjutan, uji beban & perencanaan kapasitas, dokumentasi kesiapan sertifikasi keamanan (seperti SOC2).
**Target Tonggak:** Platform lolos tinjauan keamanan pengadaan Enterprise/Pemerintah.

### Tahap 5 — Perbaikan Berkelanjutan (Berjalan Terus)
Perluasan ke kanal lain (Instagram/Messenger dalam satu Inbox yang sama), sistem multi-wilayah aktif-aktif, migrasi ke mesin pencarian AI khusus untuk skala sangat besar, uji A/B untuk gaya jawaban AI, marketplace template workflow siap pakai.

## 16. Ringkasan Tonggak Pencapaian (Milestone)

| Tonggak | Target Minggu | Kriteria Selesai |
|---|---|---|
| M1: Fondasi & Keamanan Siap | Minggu 4 | Login/2FA/RBAC berfungsi; isolasi data antar tenant terverifikasi lolos uji |
| M2: MVP WhatsApp Aktif | Minggu 12 | Nomor WhatsApp sungguhan terhubung; pesan masuk/keluar berjalan cepat (di bawah 2 detik) |
| M3: Paket Pertumbuhan Lengkap | Minggu 20 | Kampanye broadcast berhasil dikirim ke 10.000+ kontak sesuai batas kecepatan; CRM berfungsi; API publik terdokumentasi |
| M4: Otomasi + AI Aktif | Minggu 30 | Workflow Builder mendukung semua jenis node; AI Agent menjawab dari Knowledge Base dengan biaya tercatat; alur eskalasi ke manusia terverifikasi |
| M5: Siap Enterprise | Minggu 38 | Integrasi SSO teruji dengan mitra awal; uji beban mencapai target kapasitas; temuan uji keamanan sudah diperbaiki |
| M6: Peluncuran Resmi (GA) | Minggu 40 | Semua tier (Personal s.d. Pemerintah) bisa berlangganan; alur penagihan gagal-bayar teruji lengkap; panduan operasional darurat tim siap |

---

## Penutup

Dokumen ini melengkapi seri Artefak CutwayWhatsApp dengan fondasi yang menjamin sistem **tetap aman, tetap berjalan, tetap cepat meski berkembang besar, dan bisa dipercaya kualitasnya** — sekaligus memberi Anda sebagai Product Owner peta jalan yang jelas dari sekarang hingga peluncuran resmi. Bersama empat artefak sebelumnya (Database, API, Arsitektur/UI-UX, dan Workflow/AI), seluruh cetak biru CutwayWhatsApp kini lengkap dan siap dijadikan rujukan tim engineering untuk mulai membangun produk secara nyata.

---

## Ringkasan Seluruh Rangkaian Dokumen CutwayWhatsApp

| Artefak | Judul | Fokus |
|---|---|---|
| 01 | Desain Database & ERD | Struktur data, tabel, relasi, keamanan multi-tenant |
| 02 | Spesifikasi API Lengkap | Seluruh pintu integrasi sistem |
| 03 | Arsitektur Sistem, Teknologi & UI/UX | Cara kerja sistem & tampilan setiap halaman |
| 04 | Workflow Automation & AI/Knowledge Base | Mesin otomasi dan asisten AI |
| 05 | Keamanan, Infrastruktur, Skalabilitas, Testing & Roadmap | Cara sistem dijaga, dijalankan, diuji, dan rencana pengembangannya |

Seluruh cetak biru CutwayWhatsApp sudah lengkap. Silakan sampaikan jika ada bagian yang ingin diperdalam lebih jauh, atau jika Anda ingin melanjutkan ke tahap berikutnya (misalnya penulisan dokumen pitch investor, dokumen SOP tim engineering, atau mulai masuk ke tahap implementasi kode).
