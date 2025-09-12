
'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Filter as FilterIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Operator = 'contains' | 'not-contains' | 'equals' | 'not-equals';

export interface Filter {
    id: 'name' | 'email' | 'title' | 'company';
    operator: Operator;
    value: string | string[];
}

interface FilterSheetProps {
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  connections: any[];
}

const initialFilterState = {
    name: { operator: 'contains' as Operator, value: '' },
    email: { operator: 'contains' as Operator, value: '' },
    title: { operator: 'contains' as Operator, value: '' },
};


export function FilterSheet({ filters, setFilters }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(initialFilterState);

  useEffect(() => {
    // Sync local state when external filters change
    const newLocalFilters = JSON.parse(JSON.stringify(initialFilterState));
    filters.forEach(f => {
      if (f.id in newLocalFilters) {
        newLocalFilters[f.id] = { operator: f.operator, value: f.value };
      }
    });
    setLocalFilters(newLocalFilters);
  }, [filters, open]);

  const handleApply = () => {
    const newFilters: Filter[] = Object.entries(localFilters)
      .map(([id, filter]) => ({ ...filter, id }))
      .filter(f => !!f.value && f.value.length > 0) as Filter[];
    setFilters(newFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters(initialFilterState);
    setFilters([]);
    setOpen(false);
  };

  const renderTextFilter = (id: 'name' | 'email' | 'title', label: string) => (
     <div className="space-y-2">
        <Label htmlFor={`filter-${id}`}>{label}</Label>
        <div className="flex gap-2">
            <Select
                value={localFilters[id].operator}
                onValueChange={(op: Operator) => setLocalFilters(prev => ({...prev, [id]: {...prev[id], operator: op}}))}
            >
                <SelectTrigger className="w-[150px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="not-contains">Doesn't Contain</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not-equals">Doesn't Equal</SelectItem>
                </SelectContent>
            </Select>
            <Input 
                id={`filter-${id}`}
                placeholder={`Filter by ${label.toLowerCase()}...`}
                value={localFilters[id].value as string}
                onChange={(e) => setLocalFilters(prev => ({...prev, [id]: {...prev[id], value: e.target.value}}))}
            />
        </div>
    </div>
  )


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <FilterIcon className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-headline">Filter Connections</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your connections.
          </SheetDescription>
        </SheetHeader>
        <div className="py-8 space-y-4">
            {renderTextFilter('name', 'Name')}
            {renderTextFilter('email', 'Email')}
            {renderTextFilter('title', 'Title')}
        </div>
        <SheetFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClear}>Clear Filters</Button>
            <SheetClose asChild>
                <Button onClick={handleApply}>Apply Filters</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
