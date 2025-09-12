
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import type { Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { BulkUpload } from '@/components/connections/bulk-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Filter } from '@/components/connections/filter-sheet';

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
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        {companyName} Connections
      </h2>
      <Card>
        <CardHeader>
          <CardTitle>Bulk Upload</CardTitle>
          <CardDescription>
            Upload an Excel or CSV file to add multiple connections for {companyName}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkUpload associatedCompany={companyName} />
        </CardContent>
      </Card>

      <Separator />
      
      <ConnectionsTable 
        columns={columns} 
        data={filteredConnections} 
        loading={loading}
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
