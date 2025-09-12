
'use client';
import * as React from 'react';
import { XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MultiSelectProps {
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];
  placeholder?: string;
  className?: string;
  onChange: (value: string[]) => void;
  selected: string[];
}

export function MultiSelect({ options, onChange, placeholder, className, selected = [] }: MultiSelectProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const handleSelect = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={cn('w-full flex flex-col items-start gap-2', className)}>
      <Input 
        placeholder={placeholder || "Search..."}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <ScrollArea className="h-48 w-full rounded-md border p-2">
          <div className="flex flex-col gap-2">
              {filteredOptions.length > 0 ? filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                      <div
                          key={option.value}
                          className="flex items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors cursor-pointer"
                          onClick={() => handleSelect(option.value)}
                      >
                          <Checkbox
                              id={`multiselect-${option.value}`}
                              checked={isSelected}
                              onCheckedChange={() => handleSelect(option.value)}
                              aria-label={`Select ${option.label}`}
                          />
                          <Label htmlFor={`multiselect-${option.value}`} className="cursor-pointer w-full">
                              {option.label}
                          </Label>
                      </div>
                  )
              }) : (
                  <p className="text-sm text-muted-foreground text-center p-4">No options found.</p>
              )}
          </div>
      </ScrollArea>
      <div className="flex gap-1 flex-wrap">
          {selected
          .map((selectedValue) => options.find(option => option.value === selectedValue))
          .filter(Boolean)
          .map((option) => (
              <Badge
              key={option!.value}
              variant="secondary"
              className="pl-2 pr-1 py-1 flex items-center gap-1"
              >
              <span className="truncate">{option!.label}</span>
              <div
                  onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(option!.value)
                  }}
                  className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  aria-label={`Remove ${option!.label}`}
              >
                  <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </div>
              </Badge>
          ))}
      </div>
    </div>
  );
}
