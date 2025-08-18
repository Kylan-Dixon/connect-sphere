
'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { columns } from '@/components/connections/columns';

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const q = query(
      collection(db, 'connections'),
      where('reminderDate', '!=', null),
      orderBy('reminderDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const remindersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Connection[];
      setReminders(remindersData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching reminders:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        All Reminders
      </h2>
      <p className="text-muted-foreground">
        Showing all connections with a reminder date, sorted from most upcoming to farthest away.
      </p>
      <ConnectionsTable columns={columns} data={reminders} loading={loading} />
    </div>
  );
}
