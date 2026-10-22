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

const CARD_WIDTH = 960;
const CARD_HEIGHT = 520;

/** Hex approximations of `@soulsync/ui` brand greens (oklch hue 155). */
const BRAND = {
  50: '#f6faf8',
  100: '#ecf7f0',
  200: '#cce8d9',
  500: '#3a9d6e',
  600: '#2f8560',
  700: '#256b4d',
  800: '#1d5240',
} as const;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) {
    lines.push(line);
  }
  return lines.length > 0 ? lines : [text];
}

function drawLoginCodeImage(
  formatted: string,
  title: string,
  description: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return canvas;
  }

  const bgGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, CARD_HEIGHT);
  bgGrad.addColorStop(0, BRAND[50]);
  bgGrad.addColorStop(0.5, BRAND[100]);
  bgGrad.addColorStop(1, BRAND[200]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  const headerGrad = ctx.createLinearGradient(0, 0, CARD_WIDTH, 0);
  headerGrad.addColorStop(0, BRAND[800]);
  headerGrad.addColorStop(0.5, BRAND[700]);
  headerGrad.addColorStop(1, BRAND[600]);
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, CARD_WIDTH, 104);

  ctx.fillStyle = '#ffffff';
  ctx.font = '600 34px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('SoulSync Global', 48, 54);
  ctx.font = '400 14px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.globalAlpha = 0.88;
  ctx.fillText('Secure guest login code', 48, 82);
  ctx.globalAlpha = 1;

  const panelX = 48;
  const panelY = 128;
  const panelW = CARD_WIDTH - 96;
  const panelH = CARD_HEIGHT - 176;
  ctx.save();
  ctx.shadowColor = 'rgba(15, 23, 42, 0.12)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, panelX, panelY, panelW, panelH, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
  roundRect(ctx, panelX, panelY, panelW, panelH, 18);
  ctx.strokeStyle = BRAND[200];
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.font = '600 22px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText(title, panelX + 32, panelY + 48);

  ctx.fillStyle = BRAND[600];
  ctx.font = '600 11px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('LOGIN CODE', panelX + 32, panelY + 88);

  const codeBoxX = panelX + 32;
  const codeBoxY = panelY + 98;
  const codeBoxW = panelW - 64;
  const codeBoxH = 92;
  const codeFill = ctx.createLinearGradient(codeBoxX, codeBoxY, codeBoxX, codeBoxY + codeBoxH);
  codeFill.addColorStop(0, '#ffffff');
  codeFill.addColorStop(1, BRAND[50]);
  roundRect(ctx, codeBoxX, codeBoxY, codeBoxW, codeBoxH, 12);
  ctx.fillStyle = codeFill;
  ctx.fill();
  ctx.strokeStyle = BRAND[500];
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let codeSize = 40;
  const maxCodeWidth = codeBoxW - 40;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  do {
    ctx.font = `700 ${codeSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    if (ctx.measureText(formatted).width <= maxCodeWidth || codeSize <= 24) {
      break;
    }
    codeSize -= 2;
  } while (codeSize >= 24);

  ctx.fillStyle = BRAND[800];
  ctx.letterSpacing = '0.08em';
  ctx.fillText(formatted, CARD_WIDTH / 2, codeBoxY + codeBoxH / 2);
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = '#6b7280';
  ctx.font = '16px system-ui, -apple-system, Segoe UI, sans-serif';
  const descLines = wrapCanvasText(ctx, description, panelW - 64);
  descLines.slice(0, 3).forEach((line, index) => {
    ctx.fillText(line, panelX + 32, codeBoxY + codeBoxH + 40 + index * 24);
  });

  ctx.fillStyle = '#9ca3af';
  ctx.font = '13px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('Keep this code private. Anyone with this code can access your guest account.', panelX + 32, panelY + panelH - 28);

  return canvas;
}

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
    const canvas = drawLoginCodeImage(formatted, title, description);
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
      0.94,
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/25 p-5">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">{description}</p>
      </div>
      <div
        className="rounded-lg border border-[var(--border)] bg-gradient-to-b from-white to-[var(--color-brand-50)] px-3 py-3 shadow-sm"
        aria-live="polite"
      >
        <div className="overflow-x-auto rounded-md border border-[var(--border)] bg-white px-2 py-3.5 shadow-inner sm:px-4 sm:py-4">
          <p className="whitespace-nowrap text-center font-mono text-[0.8125rem] font-semibold tabular-nums tracking-[0.16em] text-[var(--color-brand-900)] sm:text-base sm:tracking-[0.2em]">
            {formatted}
          </p>
        </div>
      </div>
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
