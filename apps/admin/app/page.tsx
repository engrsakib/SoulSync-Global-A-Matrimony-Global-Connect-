import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@soulsync/ui/card';
import { getTenants } from '@/lib/api';

export default async function DashboardPage() {
  const tenants = await getTenants().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-[var(--muted-foreground)]">
          Overview of active matrimony communities on SoulSync Global.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Active tenants</CardTitle>
            <CardDescription>Communities currently enabled</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{tenants.length}</CardContent>
        </Card>
      </div>
    </div>
  );
}
