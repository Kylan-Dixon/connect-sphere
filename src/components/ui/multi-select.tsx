
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
  onValueChange?: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  modalPopover?: boolean;
  asChild?: boolean;
  onChange?: (value: string[]) => void;
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
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>(props.selected);

    React.useEffect(() => {
        setSelected(props.selected);
    }, [props.selected]);


    const handleUnselect = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, value: string) => {
        e.preventDefault();
        e.stopPropagation();
        const newSelected = selected.filter((s) => s !== value);
        setSelected(newSelected);
        onChange?.(newSelected);
    };

    const handleSelect = (value: string) => {
        const newSelected = [...selected, value];
        setSelected(newSelected);
        onChange?.(newSelected);
    }
 
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("h-full w-full justify-between", className)}
            onClick={() => setOpen(!open)}
          >
            <div className="flex gap-1 flex-wrap">
              {selected.length > 0 ? (
                selected.map((value) => {
                   const option = options.find(o => o.value === value);
                   return (
                     <Badge
                      key={value}
                      variant="secondary"
                      className="mr-1 mb-1"
                      asChild
                    >
                      <button
                        aria-label={`Remove ${option?.label} option`}
                        onClick={(e) => handleUnselect(e, value)}
                        className="flex items-center gap-1"
                      >
                         {option?.label}
                        <XCircle className="ml-2 h-4 w-4" />
                      </button>
                    </Badge>
                   )
                })
              ) : (
                <span>{placeholder ?? 'Select...'}</span>
              )}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search..." />
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandList>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                        if (selected.includes(option.value)) {
                            const newSelected = selected.filter((s) => s !== option.value);
                            setSelected(newSelected);
                            onChange?.(newSelected);
                        } else {
                            handleSelect(option.value);
                        }
                    }}
                  >
                    <CheckIcon
                      className={cn(
                        'mr-2 h-4 w-4',
                        selected.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);
MultiSelect.displayName = 'MultiSelect';
