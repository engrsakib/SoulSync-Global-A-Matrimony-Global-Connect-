-- Restore GIN indexes dropped by event_mapping (idempotent; no data loss)
CREATE INDEX IF NOT EXISTS "user_activity_logs_search_tokens_gin"
  ON "user_activity_logs" USING GIN ("searchTokens");

CREATE INDEX IF NOT EXISTS "audit_events_search_tokens_gin"
  ON "audit_events" USING GIN ("searchTokens");
