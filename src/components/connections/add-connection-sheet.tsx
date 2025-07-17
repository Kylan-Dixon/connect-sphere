
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddConnectionForm } from './add-connection-form';
import { useState } from 'react';

export function AddConnectionSheet() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Connection
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-[90vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-headline">Add New Connection</SheetTitle>
          <SheetDescription>
            Enter the details of your new connection. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <AddConnectionForm onSuccess={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
