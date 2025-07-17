
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { SidebarTrigger } from '@/components/ui/sidebar';

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
    <div className="space-y-4">
       <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">All Connections</h2>
        <SidebarTrigger />
      </div>
      <ConnectionsTable columns={columns} data={connections} loading={loading} />
    </div>
  );
}
