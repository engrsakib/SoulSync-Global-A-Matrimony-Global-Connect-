const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/v1';

export type Tenant = {
  id: string;
  slug: string;
  name: string;
  supportedReligions: string[];
  defaultLocale: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function getTenants(): Promise<Tenant[]> {
  return apiFetch<Tenant[]>('/tenants');
}

export async function getApiHealth(): Promise<{ status: string }> {
  const base = apiBaseUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/health/ready`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json() as Promise<{ status: string }>;
}
