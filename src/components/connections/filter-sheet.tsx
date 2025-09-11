
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
import { Filter } from 'lucide-react';
import type { ColumnFiltersState } from '@tanstack/react-table';
import { useState, useEffect } from 'react';

interface FilterSheetProps {
  filters: ColumnFiltersState;
  setFilters: (filters: ColumnFiltersState) => void;
}

type FilterId = 'name' | 'email' | 'company' | 'title';

export function FilterSheet({ filters, setFilters }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<Record<FilterId, string>>({
    name: '',
    email: '',
    company: '',
    title: '',
  });

  useEffect(() => {
    // Sync local state when external filters change
    const newLocalFilters = { name: '', email: '', company: '', title: '' };
    filters.forEach(f => {
      if (typeof f.id === 'string' && f.id in newLocalFilters) {
        newLocalFilters[f.id as FilterId] = f.value as string;
      }
    });
    setLocalFilters(newLocalFilters);
  }, [filters]);

  const handleApply = () => {
    const newFilters: ColumnFiltersState = Object.entries(localFilters)
      .filter(([, value]) => value)
      .map(([id, value]) => ({ id, value }));
    setFilters(newFilters);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalFilters({
      name: '',
      email: '',
      company: '',
      title: '',
    });
    setFilters([]);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
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
            <div className="space-y-2">
                <Label htmlFor="filter-name">Name</Label>
                <Input 
                    id="filter-name"
                    placeholder="Filter by name..."
                    value={localFilters.name}
                    onChange={(e) => setLocalFilters(prev => ({...prev, name: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="filter-email">Email</Label>
                <Input 
                    id="filter-email"
                    placeholder="Filter by email..."
                    value={localFilters.email}
                    onChange={(e) => setLocalFilters(prev => ({...prev, email: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="filter-company">Company</Label>
                <Input 
                    id="filter-company"
                    placeholder="Filter by company..."
                    value={localFilters.company}
                    onChange={(e) => setLocalFilters(prev => ({...prev, company: e.target.value}))}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="filter-title">Title</Label>
                <Input 
                    id="filter-title"
                    placeholder="Filter by title..."
                    value={localFilters.title}
                    onChange={(e) => setLocalFilters(prev => ({...prev, title: e.target.value}))}
                />
            </div>
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
