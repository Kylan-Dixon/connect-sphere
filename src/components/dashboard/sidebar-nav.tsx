
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
import { useSidebar } from '@/components/ui/sidebar';
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;


  const NavContent = () => (
    <TooltipProvider delayDuration={0}>
        <SidebarHeader>
            <div className={cn('p-2 transition-all duration-300', isOpen ? 'opacity-100' : 'opacity-0 h-0')}>
                <Logo />
            </div>
            <div className={cn('px-2 transition-all duration-300', isOpen ? 'opacity-100' : 'opacity-0 h-0')}>
                <AddConnectionSheet />
            </div>
        </SidebarHeader>

        <SidebarContent>
            <SidebarMenu>
            {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    {isOpen ? (
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
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                >
                                <Link href={item.href}>
                                    <item.icon />
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                                </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="center">
                                {item.label}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarContent>
        
        <SidebarSeparator />

        <SidebarFooter>
             <UserNav isOpen={isOpen} />
             {!isMobile && (
                <Button variant="ghost" size="icon" className="w-full justify-center" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                    <span className="sr-only">Toggle sidebar</span>
                </Button>
             )}
        </SidebarFooter>
    </TooltipProvider>
  )

  return <NavContent />;
}
