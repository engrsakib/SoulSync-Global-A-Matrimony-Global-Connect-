import { scopeLabel, type BiodataEditorScope } from '@soulsync/shared-types/biodata-editor-grant';
import { cn } from '@soulsync/ui/lib/utils';

export function BiodataEditorScopeBadge({
  scope,
  className,
}: {
  scope: BiodataEditorScope;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full bg-[var(--muted)]/80 px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]',
        className,
      )}
    >
      {scopeLabel(scope)}
    </span>
  );
}
