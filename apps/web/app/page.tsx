import { Badge } from '@soulsync/ui/badge';
import { Button } from '@soulsync/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@soulsync/ui/card';
import { getTenants } from '@/lib/api';

export default async function HomePage() {
  const tenants = await getTenants().catch(() => []);

  return (
    <main className="min-h-screen">
      <section className="border-b border-[var(--border)] bg-gradient-to-b from-[var(--color-brand-50)] to-[var(--background)]">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-20">
          <Badge variant="secondary">Privacy-first · Multi-faith · Consent-driven</Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-5xl">
            Find meaningful connections across faiths, on your terms.
          </h1>
          <p className="max-w-2xl text-lg text-[var(--muted-foreground)]">
            SoulSync Global is a multi-tenant matrimony marketplace built for respectful discovery,
            guardian-managed profiles, and transparent consent workflows.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button size="lg">Explore communities</Button>
            <Button size="lg" variant="outline">
              Learn how privacy works
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-6 text-2xl font-semibold">Active communities</h2>
        {tenants.length === 0 ? (
          <p className="text-[var(--muted-foreground)]">
            No communities loaded yet. Start the API and run database migrations.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardHeader>
                  <CardTitle>{tenant.name}</CardTitle>
                  <CardDescription>/{tenant.slug}</CardDescription>
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
      </section>
    </main>
  );
}
