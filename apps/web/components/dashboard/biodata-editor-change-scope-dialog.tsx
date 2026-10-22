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

type BiodataEditorChangeScopeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editorLabel: string;
  initialScope: BiodataEditorScope;
  formKey?: string;
  loading?: boolean;
  onConfirm: (scope: BiodataEditorScope) => void | Promise<void>;
};

function ChangeScopeForm({
  initialScope,
  loading,
  onConfirm,
}: {
  initialScope: BiodataEditorScope;
  loading?: boolean;
  onConfirm: (scope: BiodataEditorScope) => void | Promise<void>;
}) {
  const [scope, setScope] = React.useState<BiodataEditorScope>(initialScope);

  return (
    <>
      <BiodataEditorScopePicker value={scope} onChange={setScope} name="change-editor-scope" />
      <AlertDialogFooter>
        <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={loading}
          onClick={(event) => {
            event.preventDefault();
            void onConfirm(scope);
          }}
        >
          {loading ? 'Saving…' : 'Save'}
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  );
}

export function BiodataEditorChangeScopeDialog({
  open,
  onOpenChange,
  editorLabel,
  initialScope,
  formKey,
  loading,
  onConfirm,
}: BiodataEditorChangeScopeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Change edit access</AlertDialogTitle>
          <AlertDialogDescription>
            Update what {editorLabel} may change on your biodata.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {open ? (
          <ChangeScopeForm
            key={formKey ?? initialScope}
            initialScope={initialScope}
            loading={loading}
            onConfirm={onConfirm}
          />
        ) : null}
      </AlertDialogContent>
    </AlertDialog>
  );
}
