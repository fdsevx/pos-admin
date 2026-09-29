import { OutletProvider } from '@/context/OutletContext';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
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
  );
}
