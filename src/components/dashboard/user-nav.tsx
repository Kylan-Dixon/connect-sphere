
'use client';

import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { LogOut, User, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';
import { cn } from '@/lib/utils';

export function UserNav({ isOpen }: { isOpen?: boolean }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-4 p-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-2 flex items-center justify-between">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'relative h-10 w-full gap-2',
              isOpen ? 'justify-start' : 'justify-center size-10'
            )}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.photoURL ?? ''} alt="User avatar" />
              <AvatarFallback>
                <User />
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'flex flex-col items-start',
                isOpen ? 'opacity-100' : 'opacity-0 w-0'
              )}
            >
              <p className="text-sm font-medium leading-none">My Account</p>
              <p className="text-xs leading-none text-muted-foreground truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.displayName ?? 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className={cn(!isOpen && 'hidden')}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </div>
  );
}
