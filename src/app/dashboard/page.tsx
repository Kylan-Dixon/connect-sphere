
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

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
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, 'connections'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const connectionsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Connection[];
      setConnections(connectionsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching connections:", error);
        setLoading(false);
    });

    return () => unsubscribe();
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
