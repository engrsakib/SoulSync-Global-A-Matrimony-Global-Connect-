'use client';

import * as React from 'react';
import type { BiodataEditorScope } from '@soulsync/shared-types/biodata-editor-grant';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@soulsync/ui/alert-dialog';
import { BiodataEditorScopePicker } from '@/components/dashboard/biodata-editor-scope-picker';

type BiodataEditAccessApproveDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorLabel: string;
  loading?: boolean;
  onConfirm: (scope: BiodataEditorScope) => void | Promise<void>;
};

function ApproveScopeForm({
  loading,
  onConfirm,
}: {
  loading?: boolean;
  onConfirm: (scope: BiodataEditorScope) => void | Promise<void>;
}) {
  const [scope, setScope] = React.useState<BiodataEditorScope>('BOTH');

  return (
    <>
      <BiodataEditorScopePicker value={scope} onChange={setScope} name="approve-editor-scope" />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(event) => {
            event.preventDefault();
            void onConfirm(scope);
          }}
        >
          {loading ? 'Approving…' : 'Approve'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

export function BiodataEditAccessApproveDialog({
  open,
  onOpenChange,
  editorLabel,
  loading,
  onConfirm,
}: BiodataEditAccessApproveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Approve edit access</AlertDialogTitle>
          <AlertDialogDescription>
            Choose what {editorLabel} may change on your biodata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open ? (
          <ApproveScopeForm key="approve-scope" loading={loading} onConfirm={onConfirm} />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
