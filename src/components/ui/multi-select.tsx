
'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckIcon, XCircle, ChevronDown, XIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
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
  CommandSeparator,
} from '@/components/ui/command';

const multiSelectVariants = cva(
  'm-1',
  {
    variants: {
      variant: {
        default:
          'border-foreground/10 text-foreground bg-card hover:bg-card/80',
        secondary:
          'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        inverted: 'inverted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof multiSelectVariants> {
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

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onChange,
      placeholder,
      className,
      selected,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    const handleUnselect = (value: string) => {
        const newSelected = selected.filter((s) => s !== value);
        onChange?.(newSelected);
    };
 
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <div className="w-full">
            <PopoverTrigger asChild>
                <Button
                    ref={ref}
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("h-auto min-h-10 w-full justify-between", className)}
                    onClick={() => setOpen(!open)}
                >
                    <div className="flex gap-1 flex-wrap">
                        {selected.length === 0 && (placeholder ?? 'Select...')}
                        {selected.map((value) => {
                            const option = options.find(o => o.value === value);
                            return (
                                <Badge
                                    key={value}
                                    variant="secondary"
                                    className="pl-2 pr-1 py-1 flex items-center gap-1"
                                >
                                    <span className="truncate">{option?.label}</span>
                                    <div
                                        aria-label={`Remove ${option?.label} option`}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUnselect(value);
                                        }}
                                        className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                    >
                                        <XCircle className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                    </div>
                                </Badge>
                            )
                        })}
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
                    )
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
