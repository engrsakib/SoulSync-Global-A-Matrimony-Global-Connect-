export type MessengerChatThemeId =
  | 'default'
  | 'classic'
  | 'lavender'
  | 'mint'
  | 'rose'
  | 'darkContrast';

export type MessengerChatTheme = {
  id: MessengerChatThemeId;
  label: string;
  swatch: string;
  vars: Record<string, string>;
};

export const MESSENGER_CHAT_THEMES: MessengerChatTheme[] = [
  {
    id: 'default',
    label: 'Default',
    swatch: 'linear-gradient(135deg, #e8f5e9, #f5f5f5)',
    vars: {},
  },
  {
    id: 'classic',
    label: 'Classic',
    swatch: 'linear-gradient(135deg, #dbeafe, #eff6ff)',
    vars: {
      '--messenger-thread-bg': 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)',
      '--messenger-bubble-in': 'var(--muted)',
      '--messenger-bubble-out': 'var(--color-brand-700)',
    },
  },
  {
    id: 'lavender',
    label: 'Lavender',
    swatch: 'linear-gradient(135deg, #ede9fe, #f5f3ff)',
    vars: {
      '--messenger-thread-bg': 'linear-gradient(180deg, #f5f3ff 0%, #faf5ff 100%)',
      '--messenger-bubble-in': '#ede9fe',
      '--messenger-bubble-out': '#7c3aed',
    },
  },
  {
    id: 'mint',
    label: 'Mint',
    swatch: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
    vars: {
      '--messenger-thread-bg': 'linear-gradient(180deg, #ecfdf5 0%, #f0fdf4 100%)',
      '--messenger-bubble-in': '#d1fae5',
      '--messenger-bubble-out': '#059669',
    },
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: 'linear-gradient(135deg, #ffe4e6, #fff1f2)',
    vars: {
      '--messenger-thread-bg': 'linear-gradient(180deg, #fff1f2 0%, #fef2f2 100%)',
      '--messenger-bubble-in': '#ffe4e6',
      '--messenger-bubble-out': '#e11d48',
    },
  },
  {
    id: 'darkContrast',
    label: 'Dark',
    swatch: 'linear-gradient(135deg, #1e293b, #0f172a)',
    vars: {
      '--messenger-thread-bg': 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      '--messenger-bubble-in': '#334155',
      '--messenger-bubble-out': '#15803d',
    },
  },
];

const STORAGE_PREFIX = 'messenger-theme:';

export function loadMessengerChatTheme(conversationId: string): MessengerChatThemeId {
  if (typeof window === 'undefined') {
    return 'default';
  }
  const raw = localStorage.getItem(`${STORAGE_PREFIX}${conversationId}`);
  const match = MESSENGER_CHAT_THEMES.find((t) => t.id === raw);
  return match?.id ?? 'default';
}

export function saveMessengerChatTheme(conversationId: string, themeId: MessengerChatThemeId): void {
  localStorage.setItem(`${STORAGE_PREFIX}${conversationId}`, themeId);
}

export function themeStyleForConversation(conversationId: string): Record<string, string> {
  const id = loadMessengerChatTheme(conversationId);
  const theme = MESSENGER_CHAT_THEMES.find((t) => t.id === id) ?? MESSENGER_CHAT_THEMES[0]!;
  return { ...theme.vars };
}
