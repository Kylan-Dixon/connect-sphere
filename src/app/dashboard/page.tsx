
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import type { Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { AddConnectionForm } from '@/components/connections/add-connection-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Filter } from '@/components/connections/filter-sheet';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BulkAction } from '@/components/connections/bulk-action';
import { Trash } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return; 
    }

    setLoading(true);
    const q = query(
      collection(db, 'connections'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const connectionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Connection[];
      setAllConnections(connectionsData);
      setLoading(false);
    }, (error) => {
        console.error("DashboardPage: Error fetching connections:", error);
        setLoading(false);
    });

    return () => {
      unsubscribe();
    }
  }, [user]);

  const filteredConnections = useMemo(() => {
    if (filters.length === 0) {
      return allConnections;
    }

    return allConnections.filter(connection => {
      return filters.every(filter => {
        const connectionValue = connection[filter.id as keyof Connection] as any;
        const filterValue = filter.value;

        if (!connectionValue && filter.operator !== 'not-equals') return false;

        switch (filter.operator) {
            case 'contains':
                if (Array.isArray(filterValue)) {
                    return filterValue.includes(connectionValue);
                }
                return String(connectionValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'not-contains':
                 if (Array.isArray(filterValue)) {
                    return !filterValue.includes(connectionValue);
                }
                return !String(connectionValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'equals':
                 if (Array.isArray(filterValue)) {
                    return filterValue.includes(connectionValue);
                }
                return String(connectionValue).toLowerCase() === String(filterValue).toLowerCase();
            case 'not-equals':
                 if (Array.isArray(filterValue)) {
                    return !filterValue.includes(connectionValue);
                }
                return String(connectionValue).toLowerCase() !== String(filterValue).toLowerCase();
            default:
                return true;
        }
      });
    });
  }, [allConnections, filters]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Add a New Connection</CardTitle>
            <CardDescription>Enter the details of your new connection here.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddConnectionForm />
          </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Bulk Actions</CardTitle>
                <CardDescription>
                    Perform bulk actions like deleting connections by uploading a file with names or emails.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="destructive">
                            <Trash className="mr-2 h-4 w-4"/>
                            Perform Bulk Action
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                        <SheetHeader className="mb-4">
                            <SheetTitle>Bulk Connection Action</SheetTitle>
                            <SheetDescription>
                                Upload a file to perform a bulk action on connections.
                                You will be asked to map your file columns to match against existing data.
                            </SheetDescription>
                        </SheetHeader>
                        <BulkAction />
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
      </div>
      
      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight font-headline">All Connections</h2>
        </div>
        <ConnectionsTable 
            columns={columns} 
            data={filteredConnections} 
            loading={loading}
            filters={filters}
            setFilters={setFilters}
            allData={allConnections}
        />
      </div>
    </div>
  );
}
