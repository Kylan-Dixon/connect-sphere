'use client';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Briefcase, Users, Clock } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    financial: 0,
    coaching: 0,
    reminders: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "connections"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        let financialCount = 0;
        let coachingCount = 0;
        let reminderCount = 0;
        const now = new Date();
        now.setHours(0,0,0,0);


        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.associatedCompany === "Mohan Financial") financialCount++;
          if (data.associatedCompany === "Mohan Coaching") coachingCount++;
          if (data.reminderDate && data.reminderDate.toDate() <= now) {
            reminderCount++;
          }
        });

        setStats({
          financial: financialCount,
          coaching: coachingCount,
          reminders: reminderCount,
          total: querySnapshot.size
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const StatCard = ({ title, value, icon: Icon, loading }: {title: string, value: number, icon: React.ElementType, loading: boolean}) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? <div className="h-8 w-1/4 rounded-md bg-gray-200 animate-pulse" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Connections" value={stats.total} icon={Users} loading={loading} />
        <StatCard title="Mohan Financial" value={stats.financial} icon={Building} loading={loading} />
        <StatCard title="Mohan Coaching" value={stats.coaching} icon={Briefcase} loading={loading} />
        <StatCard title="Active Reminders" value={stats.reminders} icon={Clock} loading={loading} />
      </div>
      <div className="pt-8 text-center text-muted-foreground">
        <p>Welcome to ConnectSphere. Use the sidebar to navigate your connections.</p>
      </div>
    </div>
  );
}
