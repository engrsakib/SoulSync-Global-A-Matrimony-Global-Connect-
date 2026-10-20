import { Badge } from '@soulsync/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@soulsync/ui/card';
import { getTenants } from '@/lib/api';

export default async function TenantsPage() {
  const tenants = await getTenants().catch(() => []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Tenants</h1>
        <p className="text-[var(--muted-foreground)]">Manage multi-tenant communities and supported faiths.</p>
      </div>

      {tenants.length === 0 ? (
        <p className="text-[var(--muted-foreground)]">Unable to load tenants. Ensure the API is running.</p>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <Card key={tenant.id}>
              <CardHeader>
                <CardTitle>{tenant.name}</CardTitle>
                <CardDescription>
                  {tenant.slug} · {tenant.currency} · {tenant.defaultLocale}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {tenant.supportedReligions.map((religion) => (
                  <Badge key={religion} variant="outline">
                    {religion.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
