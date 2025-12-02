'use client';

import { AppSidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { SidebarProvider } from '@/components/ui/sidebar';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
