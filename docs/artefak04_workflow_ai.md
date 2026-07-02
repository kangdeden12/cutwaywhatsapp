# ARTEFAK 04 — WORKFLOW AUTOMATION ENGINE & ARSITEKTUR AI/KNOWLEDGE BASE CUTWAYWHATSAPP

**Untuk:** Product Owner / Founder CutwayWhatsApp
**Tujuan Dokumen:** Menjelaskan cara kerja dua fitur paling "pintar" di CutwayWhatsApp — mesin otomasi tanpa kode (Workflow Builder) dan asisten AI yang bisa belajar dari dokumen bisnis Anda (AI Agent + Knowledge Base).

---

## BAGIAN A — WORKFLOW AUTOMATION ENGINE

## 1. Apa Itu Workflow Automation?

Workflow Automation adalah fitur yang memungkinkan pengguna **membuat aturan otomatis tanpa perlu menulis kode**, cukup dengan menyusun kotak-kotak (node) di kanvas visual dan menghubungkannya dengan garis — mirip cara kerja n8n atau Zapier. Contoh sederhana:

> "Setiap kali ada pesan pertama masuk dari kontak baru **DAN** di luar jam kerja, **kirim** balasan otomatis 'Terima kasih, kami akan membalas besok pagi' **DAN** beri label 'Baru - Di Luar Jam Kerja'."

Aturan seperti ini disusun sebagai diagram, bukan kode program, sehingga pemilik bisnis atau tim non-teknis pun bisa membuat dan mengubahnya sendiri.

## 2. Bagaimana Cara Kerjanya (Alur Sederhana)

```
Sebuah kejadian terjadi (Trigger)
   Contoh: "Pesan baru masuk"
        ↓
Mesin Workflow mencari alur otomasi mana saja yang aktif untuk kejadian ini
        ↓
Mesin berjalan mengikuti diagram, kotak demi kotak, mengikuti garis penghubung
        ↓
Setiap kotak (node) melakukan tugasnya:
   - Kondisi → menentukan jalur mana yang diambil (Ya/Tidak)
   - Aksi → melakukan sesuatu (kirim pesan, ubah data, dll.)
   - Jeda → menunggu waktu tertentu sebelum lanjut
        ↓
Semua yang terjadi dicatat sebagai log, bisa dilihat pengguna untuk verifikasi
```

**Penting:** Proses ini berjalan **di latar belakang**, tidak membuat aplikasi terasa lambat — pengguna lain tetap bisa memakai Inbox atau Broadcast tanpa terganggu meskipun ada ratusan workflow sedang berjalan bersamaan.

## 3. Jenis-Jenis "Kotak" (Node) yang Tersedia

Setiap node dikelompokkan berdasarkan fungsinya:

### 3.1 Node Pemicu (Trigger) — "Kapan Alur Ini Mulai Berjalan?"
| Nama Node | Fungsi |
|---|---|
| Pesan Diterima | Berjalan setiap kali ada pesan WhatsApp masuk (bisa disaring berdasarkan kata kunci tertentu) |
| Kontak Baru Dibuat | Berjalan saat ada kontak baru tercatat di sistem |
| Jadwal (Terjadwal) | Berjalan pada waktu tertentu, sekali atau berulang (misalnya setiap jam 9 pagi) |
| Webhook Masuk | Berjalan saat sistem eksternal mengirim data ke CutwayWhatsApp |
| Deal Berpindah Tahap | Berjalan saat status deal di CRM berubah tahap |

### 3.2 Node Kondisi — "Ambil Jalur Mana?"
| Nama Node | Fungsi |
|---|---|
| Jika/Maka (If-Else) | Percabangan dua arah berdasarkan satu syarat |
| Pilihan Berganda (Switch) | Percabangan banyak arah berdasarkan nilai tertentu |
| Keputusan Kompleks | Percabangan berdasarkan gabungan beberapa syarat sekaligus |

### 3.3 Node Aksi — "Lakukan Apa?"
| Nama Node | Fungsi |
|---|---|
| Kirim Pesan | Mengirim teks atau template WhatsApp |
| Tambah/Hapus Label | Menandai kontak/percakapan dengan label tertentu |
| Ubah Data Kontak | Mengubah nilai kolom data kontak |
| Tugaskan Agen | Menentukan siapa yang menangani percakapan ini |
| Jeda/Tunggu | Menunda langkah berikutnya (misalnya "tunggu 1 jam" atau "tunggu sampai jam kerja mulai") |

### 3.4 Node Integrasi — "Hubungkan ke Sistem Lain"
| Nama Node | Fungsi |
|---|---|
| Panggilan Web (HTTP Request) | Mengirim/menerima data dari sistem lain di luar CutwayWhatsApp |
| Webhook Keluar | Mengirim notifikasi ke sistem pelanggan tanpa menunggu jawaban |
| Aksi AI | Meminta AI Agent membuatkan balasan otomatis |
| Aksi CRM | Membuat deal baru, memindah tahap, mencatat aktivitas |
| Aksi Broadcast | Memicu kampanye atau menambahkan kontak ke segmen |
| Baca Database | Mengambil data (misalnya mencari data kontak tertentu) untuk dipakai langkah berikutnya |

## 4. Variabel — "Ingatan Sementara" dalam Satu Alur

Setiap kali workflow berjalan, sistem menyimpan data sementara (variabel) yang bisa dipakai antar kotak. Contoh: kotak pertama menangkap nama kontak dari pesan masuk, kotak kedua bisa memakai nama itu untuk menyapa secara personal — "Halo {{nama_kontak}}, terima kasih sudah menghubungi kami!"

## 5. Apa yang Terjadi Jika Ada Kesalahan?

Sistem punya beberapa lapis perlindungan agar satu workflow yang error tidak merusak operasional lain:

1. **Coba ulang otomatis:** Jika satu langkah gagal (misalnya karena koneksi internet sedang bermasalah), sistem mencoba ulang beberapa kali secara otomatis sebelum menyerah.
2. **Pemberitahuan ke pemilik:** Jika akhirnya tetap gagal, pemilik workflow mendapat notifikasi agar bisa segera memeriksa.
3. **Pemutus otomatis (circuit breaker):** Jika satu workflow gagal berulang kali dalam waktu singkat (misalnya karena ada kesalahan logika yang membuatnya "berputar-putar" tanpa henti), sistem otomatis menonaktifkannya sementara dan memberi tahu pemilik — mencegah kerusakan lebih besar (misalnya mengirim ribuan pesan yang salah tanpa disadari).

## 6. Riwayat & Log Eksekusi

Setiap kali sebuah workflow berjalan, tercipta satu catatan riwayat lengkap, termasuk **hasil di setiap kotak** (berhasil/gagal, data masuk, data keluar, berapa lama prosesnya). Ini penting agar pengguna bisa mempercayai sistem otomasi — jika ada yang terasa "aneh" (misalnya pesan promo terkirim ke orang yang salah), pemilik bisnis bisa langsung menelusuri persis di mana masalahnya terjadi.

## 7. Fitur Uji Coba (Test Run)

Sebelum menerbitkan (publish) sebuah workflow agar berjalan nyata, pengguna bisa menjalankan "uji coba" dengan data contoh — sistem akan mensimulasikan seluruh alur **tanpa benar-benar mengirim pesan WhatsApp sungguhan** ke pelanggan. Ini mencegah kesalahan yang berdampak nyata sebelum alur benar-benar aktif.

---

## BAGIAN B — ARSITEKTUR AI & KNOWLEDGE BASE

## 8. Apa Itu AI Agent di CutwayWhatsApp?

AI Agent adalah asisten percakapan cerdas yang bisa **membalas pesan pelanggan secara otomatis**, dengan jawaban yang diambil dari dokumen/pengetahuan bisnis Anda sendiri (bukan jawaban generik dari internet). Teknologi di baliknya disebut **RAG (Retrieval-Augmented Generation)** — istilah yang bisa diartikan sederhana sebagai: **"AI yang mencari dulu di 'perpustakaan' Anda, baru menjawab berdasarkan apa yang ditemukan."**

## 9. Analogi Sederhana: AI Agent sebagai Karyawan Baru

Bayangkan AI Agent seperti karyawan customer service baru:

- **Knowledge Base** = buku panduan/SOP yang Anda berikan ke karyawan baru tersebut untuk dipelajari (FAQ, kebijakan retur, katalog produk, dll.)
- **RAG (pencarian pengetahuan)** = kemampuan karyawan tersebut untuk **membuka halaman yang relevan** dari buku panduan saat ada pertanyaan, bukan menjawab asal dari ingatan
- **Prompt/Kepribadian AI** = arahan gaya bicara yang Anda berikan ("selalu ramah, gunakan bahasa formal, jangan pernah berjanji soal harga tanpa konfirmasi")
- **Eskalasi ke Manusia** = karyawan ini cukup jujur untuk bilang "saya kurang yakin, biar saya panggilkan supervisor" saat pertanyaan di luar kemampuannya

## 10. Alur Kerja AI Agent Saat Ada Pesan Masuk

```
Pesan pelanggan masuk
   ↓
1. Sistem mengumpulkan konteks:
   - Ingatan percakapan sebelumnya (ringkasan + beberapa pesan terakhir)
   - Mencari bagian paling relevan dari Knowledge Base yang cocok dengan pertanyaan
   ↓
2. Sistem menyusun "instruksi lengkap" untuk AI:
   - Kepribadian/gaya bicara yang sudah diatur
   - Potongan pengetahuan relevan yang ditemukan
   - Riwayat percakapan
   - Pertanyaan pelanggan saat ini
   ↓
3. AI menghasilkan jawaban
   ↓
4. Sistem mengecek: apakah AI cukup yakin dengan jawaban ini?
   ↓
   [Yakin]  → Jawaban langsung dikirim ke pelanggan
   [Ragu]   → Percakapan diserahkan ke agen manusia, agen diberi tahu alasan AI ragu
   ↓
5. Semua ini dicatat: pertanyaan, jawaban, biaya, waktu proses — untuk transparansi & kontrol biaya
```

## 11. Knowledge Base — Bagaimana Dokumen Anda "Dipahami" AI

Proses ini terjadi otomatis di latar belakang setiap kali Anda mengunggah dokumen baru:

1. **Unggah Dokumen:** Anda unggah PDF, dokumen Word, tautan halaman web, atau menulis manual FAQ.
2. **Pemecahan (Chunking):** Sistem memecah dokumen panjang menjadi potongan-potongan kecil (setara sekitar setengah halaman), agar AI bisa mencari bagian yang paling relevan saja, bukan membaca seluruh dokumen setiap kali ada pertanyaan.
3. **Pembuatan "Sidik Makna" (Embedding):** Setiap potongan diubah menjadi kode angka khusus yang merepresentasikan **makna** teks tersebut (bukan hanya kata-katanya). Inilah yang memungkinkan AI menemukan jawaban meski pelanggan bertanya dengan kata-kata yang berbeda dari yang tertulis di dokumen.
4. **Siap Dipakai:** Setelah proses ini selesai (biasanya beberapa detik hingga menit tergantung ukuran dokumen), status dokumen berubah menjadi "Siap" dan langsung bisa dipakai AI Agent untuk menjawab pertanyaan.

**Contoh nyata manfaat "sidik makna":** Jika di dokumen Anda tertulis "Pengembalian barang maksimal 7 hari setelah pembelian", pelanggan yang bertanya "bisa refund gak kalau udah 5 hari?" tetap akan ditemukan jawabannya oleh AI — karena AI mencari berdasarkan **kemiripan makna**, bukan kecocokan kata secara harfiah.

## 12. Ingatan Percakapan (Conversation Memory)

Agar AI tidak "lupa" konteks dalam percakapan panjang, sistem menyimpan dua hal:
- **Beberapa pesan terakhir secara utuh** (misalnya 10 pesan terbaru)
- **Ringkasan otomatis dari percakapan yang lebih lama**, agar tetap ingat konteks tanpa harus mengirim seluruh riwayat panjang ke AI setiap kali (yang akan lambat dan mahal)

## 13. Kontrol Biaya AI

Setiap kali AI dipanggil, sistem mencatat:
- Berapa banyak teks yang diproses (disebut "token")
- Berapa biaya nyata yang dikeluarkan untuk panggilan tersebut
- Berapa lama waktu prosesnya

Data ini dipakai untuk dua hal penting bagi bisnis:
1. **Transparansi biaya** — Anda sebagai Product Owner bisa tahu persis berapa biaya AI per bulan, per organisasi pelanggan.
2. **Penegakan kuota paket** — setiap paket langganan (Starter, Pro, dst.) punya batas jumlah "token AI per bulan". Jika kuota habis, sistem otomatis mengalihkan percakapan ke agen manusia alih-alih terus memakai AI tanpa batas (yang bisa merugikan margin bisnis CutwayWhatsApp).

## 14. Fitur Uji Coba AI (Sebelum Dipakai ke Pelanggan Sungguhan)

Sama seperti Workflow, AI Agent punya mode "Uji Coba" di mana pemilik bisnis bisa mengetik pertanyaan contoh dan melihat bagaimana AI akan menjawab — **tanpa pesan tersebut benar-benar terkirim ke pelanggan asli**. Ini penting agar pemilik bisnis merasa yakin sebelum mengaktifkan AI secara nyata.

## 15. Fleksibilitas Penyedia AI (Tidak Terkunci ke Satu Vendor)

CutwayWhatsApp dirancang dengan lapisan "penerjemah" (adapter) antara sistem inti dan penyedia AI (misalnya Anthropic). Artinya, di masa depan:
- CutwayWhatsApp bisa menambahkan pilihan penyedia AI lain tanpa membongkar sistem inti.
- Pelanggan Enterprise yang punya kebijakan kepatuhan khusus bisa (secara opsional) memakai kunci API/model AI mereka sendiri.

## 16. Beberapa AI Agent Sekaligus dalam Satu Organisasi

Satu organisasi bisa memiliki **lebih dari satu AI Agent** dengan "kepribadian" dan sumber pengetahuan berbeda — misalnya:
- AI Agent "Customer Service" yang membaca dari FAQ produk
- AI Agent "Sales" yang membaca dari katalog dan daftar harga
- AI Agent "Klaim Garansi" yang membaca dari kebijakan garansi

Setiap AI Agent bisa diarahkan menangani jenis percakapan yang berbeda sesuai kebutuhan bisnis.

---

## Penutup

Kedua fitur di dokumen ini — Workflow Automation dan AI Agent — adalah **pembeda utama** CutwayWhatsApp dibanding sekadar aplikasi WhatsApp Business biasa. Workflow memungkinkan bisnis menjalankan aturan otomatis tanpa menunggu tim IT menulis kode, sementara AI Agent memungkinkan bisnis memberikan layanan pelanggan 24 jam yang benar-benar memahami produk/kebijakan mereka sendiri — bukan jawaban generik. Keduanya dirancang dengan prinsip yang sama: **transparan** (semua tindakan tercatat dan bisa ditelusuri), **aman** (uji coba dulu sebelum berdampak nyata), dan **terkendali biayanya** (ada batas dan pemantauan, bukan "kotak hitam" tanpa kendali).
