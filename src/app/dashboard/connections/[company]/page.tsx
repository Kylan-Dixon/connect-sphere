'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';
import { BulkUpload } from '@/components/connections/bulk-upload';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function CompanyConnectionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  const companySlug = params.company as string;
  const companyName = companySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') as 'Mohan Financial' | 'Mohan Coaching';

  useEffect(() => {
    if (!user) return; // Still require user to be logged in to view data
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
      setConnections(connectionsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching connections:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, companyName]);

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
      
      <ConnectionsTable columns={columns} data={connections} loading={loading} />
    </div>
  );
}
