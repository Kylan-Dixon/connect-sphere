
'use client';
import * as React from 'react';
import { CheckIcon, XCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

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

    const handleUnselect = (value: string) => {
      onChange(selected.filter((s) => s !== value));
    };

    return (
      <div className={cn('w-full flex flex-col items-start', className)}>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              onClick={() => setOpen(true)}
            >
              <span className="text-muted-foreground">
                {placeholder ?? 'Select...'}
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-sm p-0">
            <Command>
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No item found.</CommandEmpty>
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
                          onChange(newSelected);
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
          </DialogContent>
        </Dialog>
        <div className="flex gap-1 flex-wrap mt-2">
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
                    onClick={() => handleUnselect(option!.value)}
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
);
MultiSelect.displayName = 'MultiSelect';
