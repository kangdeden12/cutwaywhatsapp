import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CutwayWhatsApp',
  description: 'Platform WhatsApp Business SaaS multi-tenant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#FAFAF8] text-[#16221F] antialiased">{children}</body>
    </html>
  );
}
