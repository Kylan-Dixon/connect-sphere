
'use client';
import * as React from 'react';
import { CheckIcon, ChevronDown, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

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

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, onChange, placeholder, className, selected = [], ...props }, ref) => {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (e: React.MouseEvent<HTMLDivElement>, value: string) => {
      e.preventDefault();
      e.stopPropagation();
      const newSelected = selected.filter((s) => s !== value);
      onChange?.(newSelected);
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className={cn("relative w-full", className)}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full h-auto min-h-10 justify-between"
              onClick={() => setOpen(!open)}
            >
              <div className="flex gap-1 flex-wrap">
                {selected.length === 0 ? (
                  <span className="text-muted-foreground">{placeholder ?? 'Select...'}</span>
                ) : (
                  options
                    .filter((option) => selected.includes(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="secondary"
                        className="pl-2 pr-1 py-1 flex items-center gap-1"
                      >
                        <span className="truncate">{option.label}</span>
                        <div
                          onClick={(e) => handleUnselect(e, option.value)}
                          onMouseDown={(e) => e.stopPropagation()} // Prevents popover from closing on badge removal
                          className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                          aria-label={`Remove ${option.label}`}
                        >
                          <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </div>
                      </Badge>
                    ))
                )}
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      onSelect={() => {
                        let newSelected: string[];
                        if (isSelected) {
                          newSelected = selected.filter((s) => s !== option.value);
                        } else {
                          newSelected = [...selected, option.value];
                        }
                        onChange?.(newSelected);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          'mr-2 h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';
