'use client';

import * as React from 'react';
import { cn } from '@soulsync/ui/lib/utils';
import { ImageIcon, X } from 'lucide-react';
import { uploadAccountAvatarFromUrl } from '@/lib/account-api';
import { btnPrimaryLg, btnPrimaryOutline } from '@/lib/ui-classes';
import { uploadAccountAvatarWithProgress, validateAvatarFile } from '@/lib/upload-with-progress';

type AvatarUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

type FileQueueItem = {
  file: File;
  previewUrl: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
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

export function AvatarUploadDialog({ open, onClose, onSuccess }: AvatarUploadDialogProps) {
  if (!open) {
    return null;
  }

  return <AvatarUploadDialogContent onClose={onClose} onSuccess={onSuccess} />;
}

function AvatarUploadDialogContent({ onClose, onSuccess }: Omit<AvatarUploadDialogProps, 'open'>) {
  const fileInputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const abortRef = React.useRef<AbortController | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [queue, setQueue] = React.useState<FileQueueItem | null>(null);
  const [urlInput, setUrlInput] = React.useState('');
  const [urlPending, setUrlPending] = React.useState(false);
  const [urlError, setUrlError] = React.useState<string | null>(null);
  const [uploadSucceeded, setUploadSucceeded] = React.useState(false);

  const clearQueue = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setQueue((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
  }, []);

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

  React.useEffect(() => {
    return () => {
      if (queue?.previewUrl) {
        URL.revokeObjectURL(queue.previewUrl);
      }
    };
  }, [queue?.previewUrl]);

  const startFileUpload = React.useCallback(
    async (file: File) => {
      const validationError = validateAvatarFile(file);
      if (validationError) {
        setQueue({
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: 'error',
          error: validationError,
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setQueue({
        file,
        previewUrl,
        progress: 0,
        status: 'uploading',
      });
      setUploadSucceeded(false);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await uploadAccountAvatarWithProgress(file, {
          signal: controller.signal,
          onProgress: (percent) => {
            setQueue((current) =>
              current && current.file === file
                ? { ...current, progress: percent, status: 'uploading' }
                : current,
            );
          },
        });
        setQueue((current) =>
          current && current.file === file
            ? { ...current, progress: 100, status: 'done' }
            : current,
        );
        setUploadSucceeded(true);
        onSuccess();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Upload failed';
        if (message === 'Upload cancelled') {
          clearQueue();
          return;
        }
        setQueue((current) =>
          current && current.file === file
            ? { ...current, status: 'error', error: message }
            : current,
        );
      } finally {
        abortRef.current = null;
      }
    },
    [clearQueue, onSuccess],
  );

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) {
      return;
    }
    clearQueue();
    void startFileUpload(file);
  };

  const handleUrlUpload = async () => {
    const trimmed = urlInput.trim();
    if (!isHttpsUrl(trimmed)) {
      setUrlError('Enter a valid HTTPS image URL');
      return;
    }
    setUrlError(null);
    setUrlPending(true);
    try {
      await uploadAccountAvatarFromUrl(trimmed);
      setUploadSucceeded(true);
      setUrlInput('');
      onSuccess();
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : 'Import failed');
    } finally {
      setUrlPending(false);
    }
  };

  const uploading = queue?.status === 'uploading' || urlPending;
  const canDone = uploadSucceeded && !uploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={handleCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-upload-title"
        className="w-full max-w-lg rounded-2xl border border-[var(--border)]/60 bg-[var(--background)] p-6 shadow-xl sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="avatar-upload-title" className="text-xl font-bold text-[var(--foreground)]">
            Upload photo
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
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              disabled={uploading}
              onChange={(event) => onFiles(event.target.files)}
            />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-100)] text-[var(--color-brand-700)]">
              <ImageIcon className="h-8 w-8" aria-hidden />
            </div>
            <p className="text-sm text-[var(--foreground)]">
              Drop your image here, or{' '}
              <span className="font-semibold text-[var(--color-brand-700)] underline-offset-2 hover:underline">
                browse
              </span>
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Supports: PNG, JPG, JPEG · max 5MB
            </p>
          </label>

          {queue ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] p-3">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={queue.previewUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--foreground)]">
                    {queue.file.name}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {formatBytes(queue.file.size)}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  aria-label="Remove file"
                  disabled={queue.status === 'uploading'}
                  onClick={clearQueue}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {queue.status === 'uploading' || queue.status === 'done' ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--muted)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-brand-600)] transition-[width]"
                      style={{ width: `${queue.progress}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs text-[var(--muted-foreground)] tabular-nums">
                    {queue.progress}%
                  </span>
                </div>
              ) : null}
              {queue.status === 'error' && queue.error ? (
                <p className="mt-2 text-xs text-red-600" role="alert">
                  {queue.error}
                </p>
              ) : null}
            </div>
          ) : null}

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
                  'flex h-11 min-w-0 flex-1 rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 text-sm',
                  'focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:outline-none',
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
