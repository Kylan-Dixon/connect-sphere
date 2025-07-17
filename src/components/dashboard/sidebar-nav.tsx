'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building, Clock, Home } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/dashboard/user-nav';
import { AddConnectionSheet } from '@/components/connections/add-connection-sheet';
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: Home,
  },
  {
    href: '/dashboard/connections/mohan-financial',
    label: 'Mohan Financial',
    icon: Building,
  },
  {
    href: '/dashboard/connections/mohan-coaching',
    label: 'Mohan Coaching',
    icon: Briefcase,
  },
  {
    href: '/dashboard/reminders',
    label: 'Reminders',
    icon: Clock,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      <SidebarHeader>
        <div className="p-2">
          <Logo />
        </div>
        <AddConnectionSheet />
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                className="justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      
      <SidebarSeparator />

      <SidebarFooter>
        <UserNav />
      </SidebarFooter>
    </>
  );
}
