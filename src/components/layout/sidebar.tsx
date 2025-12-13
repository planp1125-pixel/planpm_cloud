'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, LayoutDashboard, Wrench, ClipboardList, Settings, PanelLeft, FileText, FlaskConical } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instruments', label: 'Instruments', icon: Wrench },
  { href: '/results', label: 'Maintenance History', icon: ClipboardList },
  { href: '/design-results', label: 'Templates', icon: FileText },
  { href: '/advisor', label: 'Predictive Advisor', icon: Bot },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="h-16 px-3 py-0 border-b">
        <div className="flex h-full items-center justify-start gap-2">
          <Button variant="ghost" size="icon" onClick={toggleSidebar}>
            <PanelLeft className="w-4 h-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          {open && (
            <Link href="/" className="flex items-center gap-2 text-lg font-bold font-headline tracking-tight whitespace-nowrap">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span>Plan-PM</span>
            </Link>
          )}
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 px-3 py-4">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className="w-full"
                tooltip={!open ? item.label : undefined}
              >
                <item.icon className="w-5 h-5" />
                {open && <span className="truncate">{item.label}</span>}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </Sidebar>
  );
}
