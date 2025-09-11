
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { bulkUpdateReminders } from '@/lib/actions';
import { DatePicker } from '../ui/datepicker';
import { addDays, addWeeks, addMonths } from 'date-fns';

interface BulkUpdateSheetProps {
  selectedConnectionIds: string[];
  onSuccess: () => void;
}

export function BulkUpdateSheet({ selectedConnectionIds, onSuccess }: BulkUpdateSheetProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const { toast } = useToast();

  const handleUpdateReminders = async () => {
    if (!reminderDate) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a reminder date.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await bulkUpdateReminders({
        connectionIds: selectedConnectionIds,
        reminderDate,
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setOpen(false);
        setReminderDate(undefined);
        onSuccess();
      } else {
        throw new Error(result.message || 'An unknown error occurred.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Bulk Update Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button disabled={selectedConnectionIds.length === 0} className="w-full sm:w-auto">
          <Calendar className="mr-2 h-4 w-4" />
          Bulk Actions
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-headline">Bulk Update Reminders</SheetTitle>
          <SheetDescription>
            You have selected {selectedConnectionIds.length} connection(s). Set a new reminder date for all of them here.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8 space-y-4">
            <p className="font-medium">Set Reminder Date</p>
            <DatePicker value={reminderDate} onChange={setReminderDate} />
             <div className="flex space-x-2 pt-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addDays(new Date(), 3))}>3 days</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addWeeks(new Date(), 1))}>1 week</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addMonths(new Date(), 3))}>3 months</Button>
             </div>
        </div>
        <SheetFooter>
            <Button 
                onClick={handleUpdateReminders} 
                disabled={isLoading || !reminderDate}
            >
                {isLoading ? 'Updating...' : `Update ${selectedConnectionIds.length} Reminders`}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
