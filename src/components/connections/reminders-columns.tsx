
'use client';

import { type ColumnDef } from '@tanstack/react-table';
import { type Connection } from '@/lib/types';
import { ArrowUpDown, MoreHorizontal, ExternalLink } from 'lucide-react';
import { AuthProvider } from '@/hooks/use-auth';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { EditConnectionSheet } from './edit-connection-sheet';
import { DeleteConnectionDialog } from './delete-connection-dialog';
import { Checkbox } from '../ui/checkbox';
import { StageBadge } from './stage-badge';


export const remindersColumns: ColumnDef<Connection>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'stage',
    header: ({ column }) => {
        return (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Stage
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        );
    },
    cell: ({ row }) => <StageBadge stage={row.getValue('stage')} />,
  },
  {
    accessorKey: 'linkedInUrl',
    header: 'LinkedIn',
    cell: ({ row }) => {
        const url = row.getValue('linkedInUrl') as string | undefined;
        if (!url) return null;
        return (
            <Button variant="ghost" size="icon" asChild>
                <Link href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">View LinkedIn</span>
                </Link>
            </Button>
        )
    }
  },
  {
    accessorKey: 'isProspect',
    header: 'Prospect',
    cell: ({ row }) => {
      const isProspect = row.getValue('isProspect');
      return isProspect ? <Badge>Yes</Badge> : null;
    },
  },
  {
    accessorKey: 'company',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Company
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
  },
  {
    accessorKey: 'title',
    header: 'Title',
  },
    {
    accessorKey: 'reminderDate',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Reminder
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
    cell: ({ row }) => {
      const date = row.original.reminderDate?.toDate();
      return date ? date.toLocaleDateString() : 'N/A';
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
  },
  {
    accessorKey: 'phoneNumber',
    header: 'Phone',
  },
  {
    accessorKey: 'hasResponded',
    header: 'Responded',
    cell: ({ row }) => {
      const hasResponded = row.getValue('hasResponded');
      return hasResponded ? <Badge variant="secondary">Yes</Badge> : null;
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.getValue('tags') as string[] | undefined;
      if (!Array.isArray(tags) || tags.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="font-normal">
              {tag.trim()}
            </Badge>
          ))}
        </div>
      );
    },
    filterFn: (row, id, value) => {
        const tags = row.getValue(id) as string[];
        return value.includes(tags);
    }
  },
  {
    accessorKey: 'referrerName',
    header: 'Referrer',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const connection = row.original;
      return (
        <AuthProvider>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <EditConnectionSheet connection={connection} />
                </DropdownMenuItem>
                {connection.linkedInUrl && (
                    <DropdownMenuItem asChild>
                        <Link href={connection.linkedInUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View LinkedIn
                        </Link>
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DeleteConnectionDialog connectionId={connection.id} connectionName={connection.name} />
            </DropdownMenuContent>
            </DropdownMenu>
        </AuthProvider>
      );
    },
  },
];
