'use client';

import { Bell, LogOut, Settings, User, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/contexts/auth-context';
import Link from 'next/link';

export function Header() {
  const { user, signOut, isLoading, displayName, isAdmin, permissions } = useAuth();

  // Get initials from display name
  const getInitials = () => {
    if (!displayName) return 'U';
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  // Determine role for display
  const getUserRole = () => {
    if (isAdmin) return 'admin';
    // Check permissions to infer role (supervisor has more permissions than user)
    const editCount = Object.values(permissions || {}).filter(v => v === 'edit').length;
    if (editCount >= 3) return 'supervisor';
    return 'user';
  };

  const getRoleBadge = () => {
    const role = getUserRole();
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600 text-white text-xs"><Shield className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'supervisor':
        return <Badge className="bg-blue-600 text-white text-xs"><Users className="w-3 h-3 mr-1" />Supervisor</Badge>;
      default:
        return <Badge className="bg-gray-600 text-white text-xs"><User className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex w-full items-center justify-end gap-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Toggle notifications</span>
        </Button>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                  <AvatarImage
                    src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                    alt={displayName || 'User'}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{displayName || 'User'}</p>
                    {getRoleBadge()}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="default" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
