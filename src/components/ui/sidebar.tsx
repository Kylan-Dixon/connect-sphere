
'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { PanelLeft } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from './sheet'
import { useIsMobile } from '@/hooks/use-mobile'

const SidebarContext = React.createContext<{ isOpen: boolean; setIsOpen: React.Dispatch<React.SetStateAction<boolean>> } | undefined>(undefined);

export const useSidebar = () => {
    const context = React.useContext(SidebarContext);
    if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
    return context;
};

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
    const isMobile = useIsMobile();
    const [isOpen, setIsOpen] = React.useState(!isMobile);
    
    React.useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        } else {
            setIsOpen(true);
        }
    }, [isMobile]);

    return <SidebarContext.Provider value={{ isOpen, setIsOpen }}>{children}</SidebarContext.Provider>;
};


export const Sidebar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const isMobile = useIsMobile();
    const { isOpen, setIsOpen } = useSidebar();

    if (isMobile) {
      return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="w-[280px] p-0">
             <div className="flex h-full flex-col bg-card text-card-foreground">
                {children}
            </div>
          </SheetContent>
        </Sheet>
      )
    }

    return (
      <aside
        ref={ref}
        className={cn(
          'hidden md:flex flex-col h-screen border-r bg-card text-card-foreground transition-all duration-300 ease-in-out',
          isOpen ? 'w-72' : 'w-20',
          className
        )}
        {...props}
      >
        {children}
      </aside>
    )
  }
)
Sidebar.displayName = 'Sidebar'

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn('py-4 border-b', className)} {...props} />
    )
  )
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn('flex-1 overflow-y-auto px-4 py-2', className)} {...props} />
    )
)
SidebarContent.displayName = 'SidebarContent';


export const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <div ref={ref} className={cn('py-2 border-t', className)} {...props} />
    )
)
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
    ({ className, ...props }, ref) => (
      <ul ref={ref} className={cn('space-y-1', className)} {...props} />
    )
)
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
    ({ className, ...props }, ref) => (
      <li ref={ref} className={cn('', className)} {...props} />
    )
);
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & { isActive?: boolean }
>(({ className, isActive, ...props }, ref) => {
  const { isOpen } = useSidebar();
  return <Button ref={ref} variant={isActive ? 'secondary' : 'ghost'} className={cn('w-full', isOpen ? 'justify-start' : 'justify-center', className)} {...props} />;
});
SidebarMenuButton.displayName = 'SidebarMenuButton';


export const SidebarTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
    (props, ref) => {
        return (
            <SheetTrigger asChild>
                    <Button ref={ref} variant="ghost" size="icon" {...props}>
                    <PanelLeft />
                    <span className="sr-only">Toggle Sidebar</span>
                </Button>
            </SheetTrigger>
        )
    }
)
SidebarTrigger.displayName = 'SidebarTrigger';

export const SidebarInset = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const isMobile = useIsMobile();
        return (
            <div ref={ref} className={cn('flex-1 flex flex-col', className)} {...props}>
                {isMobile && (
                    <header className="flex items-center justify-end p-4 border-b md:hidden">
                        <SidebarTrigger />
                    </header>
                )}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        )
    }
);
SidebarInset.displayName = 'SidebarInset';

export const SidebarSeparator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
    ({ className, ...props }, ref) => {
        return <hr ref={ref} className={cn('my-2 border-border', className)} {...props} />
    }
);
SidebarSeparator.displayName = 'SidebarSeparator';
