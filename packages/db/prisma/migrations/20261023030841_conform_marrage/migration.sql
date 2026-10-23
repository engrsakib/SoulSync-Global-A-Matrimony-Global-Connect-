-- DropIndex
DROP INDEX "audit_events_search_tokens_gin";

-- DropIndex
DROP INDEX "user_activity_logs_search_tokens_gin";

-- RenameIndex
ALTER INDEX "marriage_confirmations_initiatorUserId_partnerUserId_marriageDa" RENAME TO "marriage_confirmations_initiatorUserId_partnerUserId_marria_key";
