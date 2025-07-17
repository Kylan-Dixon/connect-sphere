'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';

export default function CompanyConnectionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const companySlug = params.company as string;
  const companyName = companySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const q = query(
      collection(db, 'connections'),
      where('userId', '==', user.uid),
      where('associatedCompany', '==', companyName),
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
  }, [user, companyName]);

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        {companyName} Connections
      </h2>
      <ConnectionsTable columns={columns} data={connections} loading={loading} />
    </div>
  );
}
