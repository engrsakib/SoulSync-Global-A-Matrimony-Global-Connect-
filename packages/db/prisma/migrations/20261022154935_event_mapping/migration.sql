-- DropIndex (IF EXISTS: indexes are created in a later migration on fresh databases)
DROP INDEX IF EXISTS "audit_events_search_tokens_gin";

-- DropIndex
DROP INDEX IF EXISTS "user_activity_logs_search_tokens_gin";
