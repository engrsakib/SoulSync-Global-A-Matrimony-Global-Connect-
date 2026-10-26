import { bffFetch } from '@/lib/bff-fetch';
import type {
  CreateMessengerConversationRequestDto,
  MessengerConversationDto,
  MessengerConversationListDto,
  MessengerKeyBundleDto,
  MessengerLinkPreviewDto,
  MessengerMessageDto,
  MessengerMessagesPageDto,
  MessengerPeerIdentityReportRequestDto,
  MessengerPeerIdentityReportResponseDto,
  MessengerPrivacyRequestDto,
  MessengerSocketTicketDto,
  PublishMessengerKeysRequestDto,
} from '@soulsync/shared-types/messenger';

async function parseData<T>(response: Response): Promise<T> {
  const raw: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : 'Request failed';
    throw new Error(message);
  }
  if (raw && typeof raw === 'object' && 'data' in raw) {
    return (raw as { data: T }).data;
  }
  return raw as T;
}

export async function fetchMessengerSocketTicket(): Promise<MessengerSocketTicketDto> {
  const response = await bffFetch('/api/messenger/socket-ticket', { method: 'POST' });
  return parseData(response);
}

export async function publishMessengerKeys(body: PublishMessengerKeysRequestDto): Promise<void> {
  const response = await bffFetch('/api/messenger/keys', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await parseData(response);
}

export async function fetchPeerKeyBundle(userId: string): Promise<MessengerKeyBundleDto> {
  const response = await bffFetch(`/api/messenger/keys/${encodeURIComponent(userId)}`);
  return parseData(response);
}

export async function fetchConversations(): Promise<MessengerConversationListDto> {
  const response = await bffFetch('/api/messenger/conversations');
  return parseData(response);
}

export async function createConversation(
  body: CreateMessengerConversationRequestDto,
): Promise<MessengerConversationDto> {
  const response = await bffFetch('/api/messenger/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseData(response);
}

export async function sendEncryptedMessage(
  conversationId: string,
  body: {
    ciphertext: string;
    nonce: string;
    header?: Record<string, unknown>;
  },
): Promise<MessengerMessageDto> {
  const response = await bffFetch(
    `/api/messenger/conversations/${encodeURIComponent(conversationId)}/messages`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  return parseData(response);
}

export async function fetchMessages(
  conversationId: string,
  cursor?: string,
): Promise<MessengerMessagesPageDto> {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  const response = await bffFetch(
    `/api/messenger/conversations/${encodeURIComponent(conversationId)}/messages${qs}`,
  );
  return parseData(response);
}

export async function acceptMessageRequest(conversationId: string): Promise<void> {
  const response = await bffFetch(
    `/api/messenger/requests/${encodeURIComponent(conversationId)}/accept`,
    { method: 'POST' },
  );
  await parseData(response);
}

export async function setMessengerPrivacy(body: MessengerPrivacyRequestDto): Promise<void> {
  const response = await bffFetch('/api/messenger/privacy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  await parseData(response);
}

export async function reportPeerIdentity(
  body: MessengerPeerIdentityReportRequestDto,
): Promise<MessengerPeerIdentityReportResponseDto> {
  const response = await bffFetch('/api/messenger/peer-identity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return parseData(response);
}

export async function fetchLinkPreview(url: string): Promise<MessengerLinkPreviewDto | null> {
  const response = await bffFetch(
    `/api/messenger/link-preview?url=${encodeURIComponent(url)}`,
  );
  return parseData(response);
}
