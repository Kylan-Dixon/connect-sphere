
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
import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Connection } from '@/lib/types';
import { MultiSelect } from '../ui/multi-select';

type Operator = 'contains' | 'not-contains' | 'equals' | 'not-equals';

export interface Filter {
    id: 'name' | 'email' | 'title' | 'associatedCompany' | 'company';
    operator: Operator;
    value: string | string[];
}

interface FilterSheetProps {
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  connections: Connection[];
}

const initialFilterState = {
    name: { operator: 'contains' as Operator, value: '' },
    email: { operator: 'contains' as Operator, value: '' },
    title: { operator: 'contains' as Operator, value: '' },
    associatedCompany: { operator: 'contains' as Operator, value: [] as string[] },
    company: { operator: 'contains' as Operator, value: [] as string[] },
};


export function FilterSheet({ filters, setFilters, connections }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(initialFilterState);

  const companies = ['Mohan Financial', 'Mohan Coaching'];

  const connectionCompanies = useMemo(() => {
    const companySet = new Set<string>();
    connections.forEach(c => {
      if (c.company) {
        companySet.add(c.company);
      }
    });
    return Array.from(companySet).sort();
  }, [connections]);

  useEffect(() => {
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
      .filter(f => {
        if (Array.isArray(f.value)) {
          return f.value.length > 0;
        }
        return !!f.value;
      }) as Filter[];
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
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-headline">Filter Connections</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your connections.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 py-8 space-y-4 overflow-y-auto">
            {renderTextFilter('name', 'Name')}
            {renderTextFilter('email', 'Email')}
            {renderTextFilter('title', 'Title')}

            <div className="space-y-2">
              <Label>Company</Label>
              <MultiSelect
                  options={connectionCompanies}
                  selected={localFilters.company.value as string[]}
                  onChange={(selected) => setLocalFilters(prev => ({...prev, company: {...prev.company, value: selected}}))}
                  placeholder='Select companies...'
              />
            </div>

            <div className="space-y-2">
                <Label>Associated Company</Label>
                <MultiSelect
                    options={companies}
                    selected={localFilters.associatedCompany.value as string[]}
                    onChange={(selected) => setLocalFilters(prev => ({...prev, associatedCompany: {...prev.associatedCompany, value: selected}}))}
                    placeholder="Select associated companies..."
                />
            </div>
        </div>
        <SheetFooter className="gap-2 sm:gap-0 border-t pt-4">
            <Button variant="outline" onClick={handleClear}>Clear Filters</Button>
            <SheetClose asChild>
                <Button onClick={handleApply}>Apply Filters</Button>
            </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
