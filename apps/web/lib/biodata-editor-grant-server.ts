import { proxyAuthGetWithToken } from '@/lib/api-auth-proxy';
import type {
  BiodataEditorGrantEditorListDto,
  BiodataEditorGrantOwnerListDto,
  BiodataManagedProfileSummaryDto,
} from '@soulsync/shared-types/biodata-editor-grant';
import {
  scopeAllowsContent,
  scopeAllowsSettings,
} from '@soulsync/shared-types/biodata-editor-grant';
import type { ManagedBiodataContextValue } from '@/lib/managed-biodata-context';
import { getAccessTokenFromCookies } from '@/lib/auth-cookie';

export async function getServerEditorGrantsAsEditor(): Promise<BiodataEditorGrantEditorListDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<BiodataEditorGrantEditorListDto>(
      '/biodata/editor-grants/mine-as-editor',
      token,
    );
  } catch {
    return null;
  }
}

export async function getServerEditorGrantsAsOwner(): Promise<BiodataEditorGrantOwnerListDto | null> {
  const token = await getAccessTokenFromCookies();
  if (!token) {
    return null;
  }

  try {
    return await proxyAuthGetWithToken<BiodataEditorGrantOwnerListDto>(
      '/biodata/editor-grants/mine-as-owner',
      token,
    );
  } catch {
    return null;
  }
}

export function resolveManagedProfileByUsername(
  list: BiodataEditorGrantEditorListDto,
  usernameRaw: string,
): BiodataManagedProfileSummaryDto | null {
  const username = usernameRaw.trim().replace(/^@+/, '').toLowerCase();
  return list.activeManaged.find((row) => row.username?.toLowerCase() === username) ?? null;
}

export function buildManagedBiodataContextValue(
  summary: BiodataManagedProfileSummaryDto,
  ownerDisplayName: string,
): ManagedBiodataContextValue {
  return {
    ownerUserId: summary.ownerUserId,
    ownerDisplayName,
    scope: summary.scope,
    canEditContent: scopeAllowsContent(summary.scope),
    canEditSettings: scopeAllowsSettings(summary.scope),
  };
}
