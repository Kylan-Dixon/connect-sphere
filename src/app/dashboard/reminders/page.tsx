
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase/client';
import { type Connection } from '@/lib/types';
import { ConnectionsTable } from '@/components/connections/connections-table';
import { remindersColumns } from '@/components/connections/reminders-columns';
import type { Filter } from '@/components/connections/filter-sheet';

export default function RemindersPage() {
  const { user } = useAuth();
  const [allReminders, setAllReminders] = useState<Connection[]>([]);
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
      where('reminderDate', '!=', null),
      orderBy('reminderDate', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const remindersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Connection[];
      setAllReminders(remindersData);
      setLoading(false);
    }, (error) => {
        console.error("RemindersPage: Error fetching reminders:", error);
        setLoading(false);
    });

    return () => {
      unsubscribe();
    }
  }, [user]);

  const filteredReminders = useMemo(() => {
    if (filters.length === 0) {
      return allReminders;
    }

    return allReminders.filter(connection => {
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
  }, [allReminders, filters]);

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight font-headline">
        All Reminders
      </h2>
      <p className="text-muted-foreground">
        Showing all connections with a reminder date, sorted from most upcoming to farthest away.
      </p>
      <ConnectionsTable 
        columns={remindersColumns} 
        data={filteredReminders} 
        loading={loading} 
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  );
}
