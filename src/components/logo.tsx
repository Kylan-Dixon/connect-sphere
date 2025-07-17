import { Share2 } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center gap-2 text-primary">
      <Share2 className="h-8 w-8" />
      <span className="font-headline text-2xl font-bold tracking-tighter">
        ConnectSphere
      </span>
    </div>
  );
}
