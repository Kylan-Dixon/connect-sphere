
'use client';

import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '../ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { BulkUpdateSheet } from './bulk-update-sheet';
import { type Connection } from '@/lib/types';
import { CheckSquare } from 'lucide-react';
import { FilterSheet, type Filter } from './filter-sheet';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading: boolean;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}

export function ConnectionsTable<TData extends Connection, TValue>({
  columns,
  data,
  loading,
  filters,
  setFilters,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
    initialState: {
        pagination: {
            pageSize: 25,
        }
    }
  });

  React.useEffect(() => {
    // Hide columns on mobile
    if (isMobile) {
      const newVisibility: VisibilityState = {};
       table.getAllColumns().forEach(col => {
        if (col.id !== 'select' && col.id !== 'name' && col.id !== 'actions' && col.id !== 'reminderDate') {
          newVisibility[col.id] = false;
        }
       });
       setColumnVisibility(newVisibility);
    } else {
      // Default desktop visibility - show all
      const newVisibility: VisibilityState = {};
      table.getAllColumns().forEach(col => {
          newVisibility[col.id] = true;
      });
      setColumnVisibility(newVisibility);
    }
  }, [isMobile, table]);

  const TableSkeleton = () => (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  );

  const selectedConnectionIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
  
  const handleSelectAllFiltered = () => {
    const allIds = table.getFilteredRowModel().rows.reduce((acc, row) => {
        acc[row.index] = true;
        return acc;
    }, {} as {[key: number]: boolean});
    table.setRowSelection(allIds);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex gap-2">
            <FilterSheet 
              filters={filters} 
              setFilters={setFilters}
              connections={data}
            />
            <BulkUpdateSheet 
                selectedConnectionIds={selectedConnectionIds}
                onSuccess={() => table.resetRowSelection()}
            />
            {table.getIsSomeRowsSelected() || table.getIsAllPageRowsSelected() ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.resetRowSelection()}
                >
                    Clear Selection
                </Button>
            ) : null}
        </div>
        <Button 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleSelectAllFiltered}
            disabled={loading || table.getFilteredRowModel().rows.length === 0}
        >
            <CheckSquare className="mr-2"/>
            Select all {table.getFilteredRowModel().rows.length} matching
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="p-2 align-top">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <TableSkeleton />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
       <div className="flex items-center justify-between space-x-2">
        <div className="text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <select
                    value={table.getState().pagination.pageSize}
                    onChange={e => {
                        table.setPageSize(Number(e.target.value))
                    }}
                    className="h-8 w-[70px] rounded-md border border-input bg-transparent px-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                    {[10, 25, 50, 100].map(pageSize => (
                        <option key={pageSize} value={pageSize}>
                           {pageSize}
                        </option>
                    ))}
                </select>
            </div>
             <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
            </div>
            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                >
                    <span className="sr-only">Go to first page</span>
                    &laquo;
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    <span className="sr-only">Go to previous page</span>
                    &lsaquo;
                </Button>
                <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    <span className="sr-only">Go to next page</span>
                    &rsaquo;
                </Button>
                <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                >
                    <span className="sr-only">Go to last page</span>
                    &raquo;
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
