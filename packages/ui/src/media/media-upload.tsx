'use client';

import { cn } from '../lib/utils';
import { Upload } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

const IMAGE_ACCEPT = 'image/jpeg,image/png,.jpg,.jpeg,.png';
const IMAGE_OR_PDF_ACCEPT = `${IMAGE_ACCEPT},application/pdf,.pdf`;

export type MediaUploadSuccess = {
  url?: string;
  publicId?: string;
  resourceType?: 'image' | 'raw';
  bytes?: number;
  user?: unknown;
};

export type MediaUploadProps = {
  mode: 'image' | 'image-or-pdf';
  uploadUrl: string;
  maxSizeBytes?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
  /** Full drop zone (default) or a single button that opens the file picker. */
  variant?: 'zone' | 'button';
  onSuccess: (result: MediaUploadSuccess) => void;
  onError: (message: string) => void;
};

function allowedMime(mode: MediaUploadProps['mode'], mime: string): boolean {
  if (mime === 'image/jpeg' || mime === 'image/png') {
    return true;
  }
  return mode === 'image-or-pdf' && mime === 'application/pdf';
}

function acceptAttr(mode: MediaUploadProps['mode']): string {
  return mode === 'image' ? IMAGE_ACCEPT : IMAGE_OR_PDF_ACCEPT;
}

function typeHint(mode: MediaUploadProps['mode']): string {
  return mode === 'image' ? 'JPEG or PNG' : 'JPEG, PNG, or PDF';
}

export function MediaUpload({
  mode,
  uploadUrl,
  maxSizeBytes = DEFAULT_MAX_BYTES,
  disabled = false,
  className,
  label = 'Upload file',
  variant = 'zone',
  onSuccess,
  onError,
}: MediaUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeBytes) {
        return 'File must be 5MB or smaller';
      }
      if (!allowedMime(mode, file.type)) {
        return `Allowed types: ${typeHint(mode)}`;
      }
      return null;
    },
    [maxSizeBytes, mode],
  );

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        onError(validationError);
        return;
      }

      setBusy(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(uploadUrl, {
          method: 'POST',
          credentials: 'include',
          body: formData,
          cache: 'no-store',
        });
        const body = (await response.json().catch(() => ({}))) as MediaUploadSuccess & {
          message?: string | string[];
        };
        if (!response.ok) {
          const message = body.message;
          const text = Array.isArray(message) ? message.join(', ') : (message ?? 'Upload failed');
          onError(text);
          return;
        }
        onSuccess(body);
      } catch {
        onError('Upload failed');
      } finally {
        setBusy(false);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    },
    [onError, onSuccess, uploadUrl, validateFile],
  );

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    if (disabled || busy) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void uploadFile(file);
    }
  };

  const input = (
    <input
      ref={inputRef}
      id={inputId}
      type="file"
      accept={acceptAttr(mode)}
      className="sr-only"
      disabled={disabled || busy}
      onChange={onPick}
    />
  );

  if (variant === 'button') {
    return (
      <div className={className}>
        {input}
        <label
          htmlFor={inputId}
          className={cn(
            'inline-flex cursor-pointer items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm font-medium text-[var(--color-brand-800)] shadow-sm transition hover:bg-[var(--color-brand-50)]',
            (disabled || busy) && 'pointer-events-none opacity-60',
          )}
        >
          {busy ? 'Uploading…' : label}
        </label>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {input}
      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !busy) {
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
          dragOver
            ? 'border-[var(--color-brand-600)] bg-[var(--color-brand-50)]'
            : 'border-[var(--border)] bg-[var(--background)]',
          (disabled || busy) && 'pointer-events-none opacity-60',
        )}
      >
        <Upload className="h-8 w-8 text-[var(--color-brand-700)]" aria-hidden />
        <span className="text-sm font-medium text-[var(--foreground)]">
          {busy ? 'Uploading…' : label}
        </span>
        <span className="text-xs text-[var(--muted-foreground)]">
          {typeHint(mode)} · max {Math.round(maxSizeBytes / (1024 * 1024))}MB
        </span>
      </label>
    </div>
  );
}
