
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { AddConnectionForm } from '@/components/connections/add-connection-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('DashboardPage: useEffect triggered.', { user: !!user });
    if (!user) {
      console.log('DashboardPage: No user found, not fetching data.');
      setLoading(false);
      return; 
    }

    console.log('DashboardPage: User found, setting up Firestore listener.');
    setLoading(true);
    const q = query(
      collection(db, 'connections'),
      orderBy('createdAt', 'desc')
    );
    console.log('DashboardPage: Query created.');

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      console.log('DashboardPage: onSnapshot fired.', { size: querySnapshot.size, empty: querySnapshot.empty });
      const connectionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Connection[];
      console.log(`DashboardPage: Parsed ${connectionsData.length} connections.`);
      setConnections(connectionsData);
      setLoading(false);
    }, (error) => {
        console.error("DashboardPage: Error fetching connections:", error);
        setLoading(false);
    });

    return () => {
      console.log('DashboardPage: Unsubscribing from Firestore listener.');
      unsubscribe();
    }
  }, [user]);

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
        <ConnectionsTable columns={columns} data={connections} loading={loading} />
      </div>
    </div>
  );
}
