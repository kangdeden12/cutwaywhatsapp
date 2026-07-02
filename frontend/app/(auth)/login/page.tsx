'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api/client';

// Sesuai Artefak 03 Bagian 6.2 (Register/Login) dan Artefak 02 Bagian 2 (API Autentikasi).

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.login({ email, password });
      if (result.requires2fa) {
        // TODO (lanjutan Claude Code): arahkan ke halaman verifikasi 2FA
        setError('Verifikasi 2FA belum diimplementasikan di starter ini.');
        return;
      }
      localStorage.setItem('cw_access_token', result.accessToken);
      localStorage.setItem('cw_refresh_token', result.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Terjadi kesalahan, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white border border-[#E8E5DD] rounded-2xl p-6">
        <h1 className="text-xl font-semibold mb-1">Masuk ke CutwayWhatsApp</h1>
        <p className="text-sm text-[#8A968F] mb-6">Kelola percakapan WhatsApp bisnis Anda.</p>

        {error && (
          <div className="bg-[#FBE8E0] text-[#B4602A] text-xs rounded-lg px-3 py-2 mb-4">{error}</div>
        )}

        <label className="text-xs text-[#8A968F] mb-1 block">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-[#F3F1EA] rounded-xl px-3.5 py-2.5 text-sm outline-none mb-3"
        />

        <label className="text-xs text-[#8A968F] mb-1 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full bg-[#F3F1EA] rounded-xl px-3.5 py-2.5 text-sm outline-none mb-5"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0F5B52] text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? 'Memproses…' : 'Masuk'}
        </button>

        <p className="text-xs text-[#8A968F] text-center mt-4">
          Belum punya akun?{' '}
          <Link href="/register" className="text-[#0F5B52] font-medium">
            Daftar
          </Link>
        </p>
      </form>
    </main>
  );
}
