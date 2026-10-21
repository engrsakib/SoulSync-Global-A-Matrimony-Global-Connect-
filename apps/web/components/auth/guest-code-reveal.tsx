'use client';

import * as React from 'react';
import { Copy, Download } from 'lucide-react';
import { formatLoginCode } from '@soulsync/shared-types';
import { buttonVariants } from '@soulsync/ui/button';
import { cn } from '@soulsync/ui/lib/utils';

type GuestCodeRevealProps = {
  loginCodePlain: string;
  title?: string;
  description?: string;
};

export function GuestCodeReveal({
  loginCodePlain,
  title = 'Your login code',
  description = 'Save this code securely. You will need it to sign in again.',
}: GuestCodeRevealProps) {
  const formatted = formatLoginCode(loginCodePlain);
  const [copied, setCopied] = React.useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const downloadJpeg = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = gradient;
    ctx.font = 'bold 42px Montserrat, sans-serif';
    ctx.fillText('SoulSync Global', 48, 72);

    ctx.fillStyle = '#374151';
    ctx.font = '24px Montserrat, sans-serif';
    ctx.fillText(title, 48, 130);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 48px ui-monospace, monospace';
    ctx.fillText(formatted, 48, 220);

    ctx.fillStyle = '#6b7280';
    ctx.font = '18px Montserrat, sans-serif';
    const lines = description.match(/.{1,52}(\s|$)/g) ?? [description];
    lines.forEach((line, index) => {
      ctx.fillText(line.trim(), 48, 300 + index * 28);
    });

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'soulsync-login-code.jpg';
        link.click();
        URL.revokeObjectURL(url);
      },
      'image/jpeg',
      0.92,
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/25 p-5">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <p
        className="rounded-lg border border-[var(--border)] bg-white px-4 py-4 text-center font-mono text-xl font-semibold tracking-[0.2em] tabular-nums sm:text-2xl"
        aria-live="polite"
      >
        {formatted}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className={cn(buttonVariants(), 'flex-1 gap-2')}
          onClick={() => {
            void copyCode();
          }}
        >
          <Copy className="h-4 w-4" aria-hidden />
          {copied ? 'Copied' : 'Copy code'}
        </button>
        <button
          type="button"
          className={cn(buttonVariants({ variant: 'outline' }), 'flex-1 gap-2')}
          onClick={downloadJpeg}
        >
          <Download className="h-4 w-4" aria-hidden />
          Download JPEG
        </button>
      </div>
    </div>
  );
}
