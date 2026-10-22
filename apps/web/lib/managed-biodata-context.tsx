'use client';

import * as React from 'react';
import type { BiodataEditorScope } from '@soulsync/shared-types/biodata-editor-grant';

export type ManagedBiodataContextValue = {
  ownerUserId: string;
  ownerDisplayName: string;
  scope: BiodataEditorScope;
  canEditContent: boolean;
  canEditSettings: boolean;
};

const ManagedBiodataContext = React.createContext<ManagedBiodataContextValue | null>(null);

export function ManagedBiodataProvider({
  value,
  children,
}: {
  value: ManagedBiodataContextValue | null;
  children: React.ReactNode;
}) {
  return <ManagedBiodataContext.Provider value={value}>{children}</ManagedBiodataContext.Provider>;
}

export function useManagedBiodata(): ManagedBiodataContextValue | null {
  return React.useContext(ManagedBiodataContext);
}

export function useManagedOwnerUserId(): string | null {
  return React.useContext(ManagedBiodataContext)?.ownerUserId ?? null;
}
