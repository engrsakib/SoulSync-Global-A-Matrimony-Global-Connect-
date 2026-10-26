export const MESSENGER_SCHEDULED_MESSAGE_QUEUE = 'messenger-scheduled-messages';

export const DELIVER_SCHEDULED_MESSAGE_JOB = 'deliver-scheduled-message';

export type DeliverScheduledMessagePayload = {
  scheduleId: string;
};

export const MESSENGER_SCHEDULE_MAX_ATTEMPTS = 8;
