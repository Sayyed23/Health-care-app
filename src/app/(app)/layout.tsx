"use client"; // This layout uses client-side hooks (usePathname) via SidebarNav

import { usePathname } from 'next/navigation';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { MainHeader } from '@/components/layout/main-header';
import { NAV_ITEMS } from '@/lib/constants';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentNavItem = NAV_ITEMS.find(item => pathname.startsWith(item.href));
  const pageTitle = currentNavItem ? currentNavItem.title : "Dashboard";

  return (
    <div className="flex min-h-screen">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <MainHeader title={pageTitle} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
