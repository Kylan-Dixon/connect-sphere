
'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options...',
  className,
}: MultiSelectProps) {
  const [search, setSearch] = React.useState('');

  const handleSelect = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        type="text"
        placeholder="Search companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />
      <ScrollArea className="h-40 w-full rounded-md border p-2">
        <div className="space-y-1">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option}
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-accent"
              >
                <Checkbox
                  id={`multi-select-${option}`}
                  checked={selected.includes(option)}
                  onCheckedChange={() => handleSelect(option)}
                />
                <Label
                  htmlFor={`multi-select-${option}`}
                  className="flex-1 cursor-pointer font-normal"
                >
                  {option}
                </Label>
              </div>
            ))
          ) : (
            <p className="p-2 text-sm text-muted-foreground">No companies found.</p>
          )}
        </div>
      </ScrollArea>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {value}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(value);
                }}
                className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
