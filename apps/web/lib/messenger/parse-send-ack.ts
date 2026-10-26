import type { MessengerMessageDto } from '@soulsync/shared-types/messenger';

export type MessengerSendAck = {
  message?: MessengerMessageDto;
  error?: string;
};

function isMessageDto(value: unknown): value is MessengerMessageDto {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const row = value as Record<string, unknown>;
  return typeof row.id === 'string' && typeof row.conversationId === 'string';
}

export function parseMessengerSendAck(raw: unknown): MessengerSendAck {
  if (raw == null) {
    return { error: 'EMPTY_ACK' };
  }
  if (typeof raw !== 'object') {
    return { error: 'INVALID_ACK' };
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.error === 'string') {
    return { error: record.error };
  }
  if (isMessageDto(record.message)) {
    return { message: record.message };
  }
  if (isMessageDto(record)) {
    return { message: record };
  }
  if (record.data && typeof record.data === 'object') {
    const data = record.data as Record<string, unknown>;
    if (isMessageDto(data.message)) {
      return { message: data.message };
    }
    if (isMessageDto(data)) {
      return { message: data };
    }
  }
  return { error: 'INVALID_ACK' };
}
