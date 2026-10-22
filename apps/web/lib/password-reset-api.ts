import { readApiErrorMessage, unwrapApiPayload } from '@soulsync/shared-types';

type MessageResponse = { message: string };

async function passwordResetFetch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  const raw: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(readApiErrorMessage(raw, `Request failed (${response.status})`));
  }

  return unwrapApiPayload<T>(raw);
}

export function requestPasswordReset(email: string): Promise<MessageResponse> {
  return passwordResetFetch<MessageResponse>('/api/auth/password-reset/request', { email });
}

export function verifyPasswordResetCode(email: string, code: string): Promise<MessageResponse> {
  return passwordResetFetch<MessageResponse>('/api/auth/password-reset/verify-code', {
    email,
    code,
  });
}

export function confirmPasswordReset(
  email: string,
  newPassword: string,
  confirmPassword: string,
): Promise<MessageResponse> {
  return passwordResetFetch<MessageResponse>('/api/auth/password-reset/confirm', {
    email,
    newPassword,
    confirmPassword,
  });
}
