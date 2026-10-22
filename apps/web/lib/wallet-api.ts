import type {
  CreditTransactionListDto,
  CreditWalletSummaryDto,
} from '@soulsync/shared-types/credits';
import { bffFetch } from '@/lib/bff-fetch';

type ApiData<T> = { data: T };

export async function fetchWalletSummary(): Promise<CreditWalletSummaryDto> {
  const res = await bffFetch('/api/wallet');
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Could not load wallet');
  }
  const json = (await res.json()) as ApiData<CreditWalletSummaryDto>;
  return json.data;
}

export async function fetchWalletTransactions(options?: {
  limit?: number;
  cursor?: string;
}): Promise<CreditTransactionListDto> {
  const params = new URLSearchParams();
  if (options?.limit !== undefined) {
    params.set('limit', String(options.limit));
  }
  if (options?.cursor) {
    params.set('cursor', options.cursor);
  }
  const qs = params.toString();
  const url = qs ? `/api/wallet/transactions?${qs}` : '/api/wallet/transactions';
  const res = await bffFetch(url);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Could not load transactions');
  }
  const json = (await res.json()) as ApiData<CreditTransactionListDto>;
  return json.data;
}
