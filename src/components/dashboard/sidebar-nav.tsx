
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Building, Clock, Home, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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
import { useSidebar } from '@/hooks/use-sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  const { isOpen, setIsOpen } = useSidebar();

  const NavContent = () => (
    <TooltipProvider delayDuration={0}>
        <SidebarHeader>
            <div className={cn('p-2 transition-all duration-300', isOpen ? 'opacity-100' : 'opacity-0 h-0 md:opacity-100 md:h-auto')}>
                <Logo />
            </div>
            <div className={cn('px-2 transition-all duration-300', isOpen ? 'opacity-100' : 'opacity-0 h-0 md:opacity-100 md:h-auto')}>
                <AddConnectionSheet />
            </div>
        </SidebarHeader>

        <SidebarContent>
            <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <SidebarMenuButton
                                asChild
                                isActive={pathname === item.href}
                            >
                            <Link href={item.href}>
                                <item.icon />
                                <span className={cn(isOpen ? 'inline' : 'hidden')}>
                                    {item.label}
                                </span>
                            </Link>
                            </SidebarMenuButton>
                        </TooltipTrigger>
                        {!isOpen && (
                            <TooltipContent side="right" align="center">
                                {item.label}
                            </TooltipContent>
                        )}
                    </Tooltip>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        
        <SidebarSeparator />

        <SidebarFooter>
             <UserNav isOpen={isOpen} />
             <Button variant="ghost" size="icon" className="w-full justify-center hidden md:flex" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                <span className="sr-only">Toggle sidebar</span>
            </Button>
        </SidebarFooter>
    </TooltipProvider>
  )

  return <NavContent />;
}
