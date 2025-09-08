
'use client';

import { type ReactNode } from 'react';
import { AuthProvider, useRequireAuth } from '@/hooks/use-auth';
import { Sidebar, SidebarProvider, SidebarTrigger, MobileHeader } from '@/components/ui/sidebar';
import { SidebarNav } from '@/components/dashboard/sidebar-nav';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardLayoutContent({ children }: { children: ReactNode }) {
  const { loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
        <div className="flex min-h-screen">
            <Sidebar>
                <SidebarNav />
            </Sidebar>
            <div className="flex-1 flex flex-col">
              <MobileHeader>
                <SidebarTrigger />
              </MobileHeader>
              <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">{children}</main>
            </div>
        </div>
    </SidebarProvider>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </AuthProvider>
  );
}
