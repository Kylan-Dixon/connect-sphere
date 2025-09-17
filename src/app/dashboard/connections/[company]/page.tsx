
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import type { Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import type { Filter } from '@/components/connections/filter-sheet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { BulkAction } from '@/components/connections/bulk-action';
import { BulkUpload } from '@/components/connections/bulk-upload';
import { Trash, Upload } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function CompanyConnectionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [allConnections, setAllConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);


  const companySlug = params.company as string;
  const companyName = companySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') as 'Mohan Financial' | 'Mohan Coaching';

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return; 
    }

    setLoading(true);

    const q = query(
      collection(db, 'connections'),
      where('associatedCompany', '==', companyName),
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
        console.error(`CompanyConnectionsPage (${companyName}): Error fetching connections:`, error);
        setLoading(false);
    });

    return () => {
      unsubscribe();
    }
  }, [user, companyName]);

  const filteredConnections = useMemo(() => {
    if (filters.length === 0) {
      return allConnections;
    }

    return allConnections.filter(connection => {
      return filters.every(filter => {
        const connectionValue = connection[filter.id as keyof Connection] as any;
        const filterValue = filter.value;

        if (!connectionValue) return false;

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Bulk Upload Connections</CardTitle>
                <CardDescription>
                    Add multiple new connections to {companyName} by uploading a file.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline">
                            <Upload className="mr-2 h-4 w-4"/>
                            Bulk Upload
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                        <SheetHeader className="mb-4">
                            <SheetTitle>Bulk Upload Connections</SheetTitle>
                            <SheetDescription>
                                Upload a file to add new connections. You'll be able to map columns before importing.
                            </SheetDescription>
                        </SheetHeader>
                        <BulkUpload associatedCompany={companyName} />
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Bulk Clean Connections</CardTitle>
                <CardDescription>
                    Remove connections from {companyName} by uploading a file of existing clients to match against.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="destructive">
                            <Trash className="mr-2 h-4 w-4"/>
                            Bulk Delete
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                        <SheetHeader className="mb-4">
                            <SheetTitle>Bulk Connection Delete</SheetTitle>
                            <SheetDescription>
                                Upload a file to find and delete existing connections.
                                You will be asked to map your file columns and review all matches before deletion.
                            </SheetDescription>
                        </SheetHeader>
                        <BulkAction associatedCompany={companyName} />
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
       </div>
      
      <Separator />

      <h2 className="text-3xl font-bold tracking-tight font-headline">
        {companyName} Connections
      </h2>
      
      <ConnectionsTable 
        columns={columns} 
        data={filteredConnections} 
        loading={loading}
        filters={filters}
        setFilters={setFilters}
        allData={allConnections}
      />
    </div>
  );
}
