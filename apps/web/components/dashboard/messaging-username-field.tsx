'use client';

import type { ComponentType } from 'react';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { formControlClass } from '@/lib/ui-classes';

export function MessagingUsernameField({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={id} className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden />
        {label}
      </Label>
      <input
        id={id}
        className={cn(formControlClass, 'mt-1.5')}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
