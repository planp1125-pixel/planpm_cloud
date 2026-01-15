'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, ClipboardList, Settings, PanelLeft, FileText, Users } from 'lucide-react';
import Image from 'next/image';
import planpmLogo from '../../../icons/planpm.png';
import {
  Sidebar,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth, UserPermissions } from '@/contexts/auth-context';

interface MenuItem {
  href: string;
  label: string;
  icon: any;
  permission?: keyof UserPermissions;
}

const menuItems: MenuItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { href: '/instruments', label: 'Instruments', icon: Wrench, permission: 'instruments' },
  { href: '/results', label: 'Maintenance History', icon: ClipboardList, permission: 'maintenance_history' },
  { href: '/design-results', label: 'Templates', icon: FileText, permission: 'design_templates' },
  { href: '/settings', label: 'Settings', icon: Settings, permission: 'settings' },
  { href: '/user-management', label: 'User Management', icon: Users, permission: 'user_management' },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { open, toggleSidebar } = useSidebar();
  const { hasPermission } = useAuth();

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission, 'view');
  });

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
              <Image
                src={planpmLogo}
                alt="Plan PM logo"
                width={90}
                height={90}
                className="object-contain"
              />
              <span>Plan-PM</span>
            </Link>
          )}
        </div>
      </SidebarHeader>
      <SidebarMenu className="flex-1 px-3 py-4">
        {visibleMenuItems.map((item) => (
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
