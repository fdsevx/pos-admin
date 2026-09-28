import type { Metadata } from 'next';
import './globals.css';
import { OutletProvider } from '@/context/OutletContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export const metadata: Metadata = {
  title: 'Kolabo POS — Dashboard Admin & Akuntansi',
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
        <OutletProvider>
          <div className="min-h-screen flex flex-col">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col flex-1">
              <Header />
              <main className="flex-1 p-4 sm:p-8">
                {children}
              </main>
            </div>
          </div>
        </OutletProvider>
      </body>
    </html>
  );
}
