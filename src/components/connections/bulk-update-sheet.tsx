
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
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { bulkUpdateConnections } from '@/lib/actions';
import { DatePicker } from '../ui/datepicker';
import { addDays, addWeeks, addMonths } from 'date-fns';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';

interface BulkUpdateSheetProps {
  selectedConnectionIds: string[];
  onSuccess: () => void;
}

export function BulkUpdateSheet({ selectedConnectionIds, onSuccess }: BulkUpdateSheetProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderDate, setReminderDate] = useState<Date | undefined>();
  const [stage, setStage] = useState<string | undefined>();
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!reminderDate && !stage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select a reminder date or a stage to update.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const updateData: { reminderDate?: Date; stage?: number } = {};
      if (reminderDate) updateData.reminderDate = reminderDate;
      if (stage) updateData.stage = parseInt(stage, 10);
      
      const result = await bulkUpdateConnections({
        connectionIds: selectedConnectionIds,
        updateData,
      });

      if (result.success) {
        toast({
          title: 'Success!',
          description: result.message,
        });
        setOpen(false);
        setReminderDate(undefined);
        setStage(undefined);
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

  const hasSelection = selectedConnectionIds.length > 0;
  const hasUpdateValue = reminderDate !== undefined || stage !== undefined;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button disabled={!hasSelection} className="w-full sm:w-auto">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Bulk Actions
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-headline">Bulk Update Connections</SheetTitle>
          <SheetDescription>
            You have selected {selectedConnectionIds.length} connection(s). Set a new reminder date or stage for all of them here.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8 space-y-8">
            <div className="space-y-4">
                <Label className="font-medium">Set Reminder Date</Label>
                <DatePicker value={reminderDate} onChange={setReminderDate} />
                 <div className="flex space-x-2 pt-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addDays(new Date(), 3))}>3 days</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addWeeks(new Date(), 1))}>1 week</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setReminderDate(addMonths(new Date(), 3))}>3 months</Button>
                 </div>
            </div>
             <div className="space-y-4">
                <Label className="font-medium">Set Stage</Label>
                <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="1">Stage 1</SelectItem>
                        <SelectItem value="2">Stage 2</SelectItem>
                        <SelectItem value="3">Stage 3</SelectItem>
                        <SelectItem value="4">Stage 4</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <SheetFooter>
            <Button 
                onClick={handleUpdate} 
                disabled={isLoading || !hasUpdateValue}
            >
                {isLoading ? 'Updating...' : `Update ${selectedConnectionIds.length} Connection(s)`}
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
