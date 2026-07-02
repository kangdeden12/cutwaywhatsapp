import Link from 'next/link';

// Halaman placeholder. Landing page lengkap dibangun sesuai
// Artefak 03 Bagian 6.2 (Landing Page) oleh Claude Code pada tahap lanjutan.

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold mb-2">CutwayWhatsApp</h1>
      <p className="text-sm text-[#5B6B67] mb-6">Starter project — landing page penuh belum dibangun.</p>
      <Link href="/login" className="bg-[#0F5B52] text-white text-sm font-medium px-5 py-2.5 rounded-full">
        Masuk ke Aplikasi
      </Link>
    </main>
  );
}
