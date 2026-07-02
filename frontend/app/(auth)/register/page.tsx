'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.register({ email, password, fullName });
      // TODO (lanjutan Claude Code): tampilkan layar "Verifikasi email Anda"
      // sesuai alur di Artefak 05 (Onboarding: Register -> Verify Email -> Subscription)
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#E8E5DD] rounded-2xl p-6">
        <h1 className="text-xl font-semibold mb-1">Buat Akun CutwayWhatsApp</h1>
        <p className="text-sm text-[#8A968F] mb-6">Mulai kelola WhatsApp bisnis Anda dalam hitungan menit.</p>

        {error && (
          <div className="bg-[#FBE8E0] text-[#B4602A] text-xs rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <label className="text-xs text-[#8A968F] mb-1 block">Nama Lengkap</label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full bg-[#F3F1EA] rounded-xl px-3.5 py-2.5 text-sm outline-none mb-3"
        />

        <label className="text-xs text-[#8A968F] mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#F3F1EA] rounded-xl px-3.5 py-2.5 text-sm outline-none mb-3"
        />

        <label className="text-xs text-[#8A968F] mb-1 block">Password (minimal 8 karakter)</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
          className="w-full bg-[#F3F1EA] rounded-xl px-3.5 py-2.5 text-sm outline-none mb-5"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F5B52] text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? 'Memproses…' : 'Daftar'}
        </button>

        <p className="text-xs text-[#8A968F] text-center mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-[#0F5B52] font-medium">
            Masuk
          </Link>
        </p>
      </form>
    </main>
  );
}
