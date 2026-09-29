import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POS BWX — Dashboard Admin & Akuntansi',
  description: 'Sistem POS & Akuntansi Modern untuk Restoran dan Cafe',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-[#f4f6fa] text-slate-800 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
