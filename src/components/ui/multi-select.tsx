'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
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
      <div className="h-96 w-full rounded-md border p-2 overflow-y-auto">
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
      </div>
    </div>
  );
}
