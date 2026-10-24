'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { btnPrimaryLg, btnPrimaryOutline, formControlClass } from '@/lib/ui-classes';
import { validateAvatarFile } from '@/lib/upload-with-progress';

export type ProfileImageUploadHandlers = {
  uploadFile: (
    file: File,
    options: { signal?: AbortSignal; onProgress: (percent: number) => void },
  ) => Promise<void>;
  uploadFromUrl?: (url: string) => Promise<unknown>;
};

type ProfileImageUploadDialogProps = ProfileImageUploadHandlers & {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  /** Allow selecting many files at once (e.g. biodata gallery). */
  multiple?: boolean;
  /** When `multiple`, cap how many files are taken from one pick/drop (remaining gallery slots). */
  maxFiles?: number;
};

type FileQueueItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isHttpsUrl(value: string): boolean {
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function fileQueueId(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function ProfileImageUploadDialog({
  open,
  onClose,
  onSuccess,
  uploadFile,
  uploadFromUrl,
  title = 'Upload photo',
  multiple = false,
  maxFiles,
}: ProfileImageUploadDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <ProfileImageUploadDialogContent
      onClose={onClose}
      onSuccess={onSuccess}
      uploadFile={uploadFile}
      uploadFromUrl={uploadFromUrl}
      title={title}
      multiple={multiple}
      maxFiles={maxFiles}
    />
  );
}

function ProfileImageUploadDialogContent({
  onClose,
  onSuccess,
  uploadFile,
  uploadFromUrl,
  title,
  multiple,
  maxFiles,
}: Omit<ProfileImageUploadDialogProps, 'open'>) {
  const fileInputId = React.useId();
  const dialogTitleId = React.useId();
  const abortRef = React.useRef<AbortController | null>(null);
  const batchAbortRef = React.useRef(false);
  const [dragOver, setDragOver] = React.useState(false);
  const [queue, setQueue] = React.useState<FileQueueItem[]>([]);
  const [urlInput, setUrlInput] = React.useState('');
  const [urlPending, setUrlPending] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [uploadSucceeded, setUploadSucceeded] = React.useState(false);
  const [batchRunning, setBatchRunning] = React.useState(false);

  const revokeQueuePreviews = React.useCallback((items: FileQueueItem[]) => {
    for (const item of items) {
      URL.revokeObjectURL(item.previewUrl);
    }
  }, []);

  const clearQueue = React.useCallback(() => {
    batchAbortRef.current = true;
    abortRef.current?.abort();
    abortRef.current = null;
    setQueue((current) => {
      revokeQueuePreviews(current);
      return [];
    });
    setBatchRunning(false);
  }, [revokeQueuePreviews]);

  const handleCancel = React.useCallback(() => {
    clearQueue();
    onClose();
  }, [clearQueue, onClose]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleCancel]);

  const queueRef = React.useRef<FileQueueItem[]>([]);
  React.useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  React.useEffect(() => {
    return () => revokeQueuePreviews(queueRef.current);
  }, [revokeQueuePreviews]);

  const updateQueueItem = React.useCallback((id: string, patch: Partial<FileQueueItem>) => {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const uploadOne = React.useCallback(
    async (item: FileQueueItem) => {
      const controller = new AbortController();
      abortRef.current = controller;

      updateQueueItem(item.id, { status: 'uploading', progress: 0, error: undefined });

      try {
        await uploadFile(item.file, {
          signal: controller.signal,
          onProgress: (percent) => {
            updateQueueItem(item.id, { progress: percent, status: 'uploading' });
          },
        });
        updateQueueItem(item.id, { progress: 100, status: 'done' });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        if (message === 'Upload cancelled') {
          return false;
        }
        updateQueueItem(item.id, { status: 'error', error: message });
        return false;
      } finally {
        abortRef.current = null;
      }
    },
    [updateQueueItem, uploadFile],
  );

  const runBatch = React.useCallback(
    async (items: FileQueueItem[]) => {
      batchAbortRef.current = false;
      setBatchRunning(true);
      setUploadSucceeded(false);

      let successCount = 0;
      for (const item of items) {
        if (batchAbortRef.current) {
          break;
        }
        if (item.status === 'error') {
          continue;
        }
        const ok = await uploadOne(item);
        if (ok) {
          successCount += 1;
        }
        if (batchAbortRef.current) {
          break;
        }
      }

      setBatchRunning(false);
      if (successCount > 0) {
        setUploadSucceeded(true);
        onSuccess();
      }
    },
    [onSuccess, uploadOne],
  );

  const onFiles = (files: FileList | null, input?: HTMLInputElement | null) => {
    if (!files?.length) {
      return;
    }

    let selected = Array.from(files);
    if (multiple) {
      const cap = typeof maxFiles === 'number' && maxFiles > 0 ? maxFiles : selected.length;
      if (selected.length > cap) {
        toast.message(
          `Only ${cap} more photo${cap === 1 ? '' : 's'} can be added; uploading the first ${cap}.`,
        );
        selected = selected.slice(0, cap);
      }
    } else {
      selected = selected.slice(0, 1);
    }

    const nextQueue: FileQueueItem[] = selected.map((file, index) => {
      const validationError = validateAvatarFile(file);
      return {
        id: fileQueueId(file, index),
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError ?? undefined,
      };
    });

    setQueue((current) => {
      revokeQueuePreviews(current);
      return nextQueue;
    });

    const uploadable = nextQueue.filter((item) => item.status !== 'error');
    if (uploadable.length === 0) {
      return;
    }

    if (multiple) {
      void runBatch(nextQueue);
    } else {
      void (async () => {
        setBatchRunning(true);
        const ok = await uploadOne(uploadable[0]!);
        setBatchRunning(false);
        if (ok) {
          setUploadSucceeded(true);
          onSuccess();
        }
      })();
    }

    if (input) {
      input.value = '';
    }
  };

  const handleUrlUpload = async () => {
    if (!uploadFromUrl) {
      return;
    }
    const trimmed = urlInput.trim();
    if (!isHttpsUrl(trimmed)) {
      setUrlError('Enter a valid HTTPS image URL');
      return;
    }
    setUrlError(null);
    setUrlPending(true);
    try {
      await uploadFromUrl(trimmed);
      setUploadSucceeded(true);
      setUrlInput('');
      onSuccess();
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setUrlPending(false);
    }
  };

  const uploading = batchRunning || urlPending;
  const canDone = uploadSucceeded && !uploading;

  const dropHint = multiple
    ? maxFiles && maxFiles > 0
      ? `Supports: PNG, JPG, JPEG · max 5MB each · up to ${maxFiles} at once`
      : 'Supports: PNG, JPG, JPEG · max 5MB each'
    : 'Supports: PNG, JPG, JPEG · max 5MB';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={handleCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogTitleId}
        className="w-full max-w-lg rounded-2xl border border-[var(--border)]/60 bg-[var(--background)] p-6 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={dialogTitleId} className="text-xl font-bold text-[var(--foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg p-1 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <label
            htmlFor={fileInputId}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              if (!uploading) {
                onFiles(event.dataTransfer.files);
              }
            }}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-10 text-center transition-colors',
              dragOver
                ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
                : 'border-[var(--color-brand-400)]/50 bg-[var(--color-brand-50)]/40',
              uploading && 'pointer-events-none cursor-not-allowed opacity-60',
            )}
          >
            <input
              id={fileInputId}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              multiple={multiple}
              className="sr-only"
              disabled={uploading}
              onChange={(event) => onFiles(event.target.files, event.target)}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              <ImageIcon className="h-8 w-8" aria-hidden />
            </div>
            <p className="text-sm text-[var(--foreground)]">
              Drop your {multiple ? 'images' : 'image'} here, or{' '}
              <span className="font-semibold text-[var(--color-brand-700)] underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">{dropHint}</p>
          </label>

          {queue.length > 0 ? (
            <ul className="max-h-56 space-y-2 overflow-y-auto">
              {queue.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3"
                >
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {item.file.name}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatBytes(item.file.size)}
                      </p>
                    </div>
                    {!batchRunning && item.status !== 'uploading' ? (
                      <button
                        type="button"
                        className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        aria-label="Remove file"
                        onClick={() => {
                          setQueue((current) => {
                            const removed = current.find((row) => row.id === item.id);
                            if (removed) {
                              URL.revokeObjectURL(removed.previewUrl);
                            }
                            return current.filter((row) => row.id !== item.id);
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  {item.status === 'uploading' || item.status === 'done' ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-brand-600)] transition-[width]"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-[var(--muted-foreground)] tabular-nums">
                        {item.progress}%
                      </span>
                    </div>
                  ) : null}
                  {item.status === 'error' && item.error ? (
                    <p className="mt-2 text-xs text-red-600" role="alert">
                      {item.error}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {uploadFromUrl ? (
            <>
              <div className="relative flex items-center py-1">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <span className="px-3 text-xs text-[var(--muted-foreground)]">or</span>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[var(--foreground)]">Import from URL</p>
                <div className="mt-2 flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(event) => setUrlInput(event.target.value)}
                    placeholder="https://example.com/photo.jpg"
                    disabled={uploading}
                    className={cn(
                      formControlClass,
                      'min-w-0 flex-1',
                    )}
                  />
                  <button
                    type="button"
                    disabled={uploading || !urlInput.trim()}
                    onClick={() => {
                      void handleUrlUpload();
                    }}
                    className={cn(
                      'inline-flex h-11 shrink-0 items-center justify-center rounded-[var(--radius)] px-4 text-sm font-semibold text-white',
                      'bg-[var(--color-brand-700)] hover:bg-[var(--color-brand-800)] disabled:opacity-50',
                    )}
                  >
                    {urlPending ? 'Uploading…' : 'Upload'}
                  </button>
                </div>
                {urlError ? (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    {urlError}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(btnPrimaryOutline, 'h-11 w-full px-6 text-sm sm:w-auto')}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canDone}
            onClick={onClose}
            className={cn(btnPrimaryLg, 'h-11 w-full sm:w-auto sm:min-w-[7rem] sm:px-8')}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
