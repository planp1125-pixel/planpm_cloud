'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FlaskConical, LayoutDashboard, Wrench } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instruments', label: 'Instruments', icon: Wrench },
  { href: '/advisor', label: 'Predictive Advisor', icon: Bot },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r">
      <SidebarHeader>
        <Link href="/" className="flex items-center gap-2 p-2">
          <FlaskConical className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">LabTrack</h1>
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarMenu className="flex-1 p-4">
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                className="w-full"
              >
                <item.icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <Separator />
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground">&copy; 2024 LabTrack Inc.</p>
      </SidebarFooter>
    </Sidebar>
  );
}
