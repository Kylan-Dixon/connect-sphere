
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { AddConnectionForm } from '@/components/connections/add-connection-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Filter } from '@/components/connections/filter-sheet';

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

        if (filter.id === 'company' && filter.operator === 'in') {
             if (Array.isArray(filterValue) && filterValue.length > 0) {
                return filterValue.map(v => v.toLowerCase()).includes(String(connectionValue).toLowerCase());
            }
            return true; // if no companies selected, show all
        }

        if (!connectionValue && filter.operator !== 'not-equals') return false;


        switch (filter.operator) {
            case 'contains':
                return String(connectionValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'not-contains':
                return !String(connectionValue).toLowerCase().includes(String(filterValue).toLowerCase());
            case 'equals':
                return String(connectionValue).toLowerCase() === String(filterValue).toLowerCase();
            case 'not-equals':
                return String(connectionValue).toLowerCase() !== String(filterValue).toLowerCase();
            default:
                return true;
        }
      });
    });
  }, [allConnections, filters]);

  const uniqueCompanies = useMemo(() => {
    const companies = new Set(allConnections.map(c => c.company).filter(Boolean) as string[]);
    return Array.from(companies);
  }, [allConnections]);

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Add a New Connection</CardTitle>
          <CardDescription>Enter the details of your new connection here.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddConnectionForm />
        </CardContent>
      </Card>
      
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
            uniqueCompanies={uniqueCompanies}
        />
      </div>
    </div>
  );
}
