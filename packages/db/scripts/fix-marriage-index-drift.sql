-- Point the partner unique index at the Prisma `map` name (idempotent).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'marriage_confirmations'
      AND indexname = 'marriage_confirmations_initiatorUserId_partnerUserId_marria_key'
  ) THEN
    ALTER INDEX "marriage_confirmations_initiatorUserId_partnerUserId_marria_key"
      RENAME TO "marriage_confirmations_initiator_partner_date_key";
  ELSIF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'marriage_confirmations'
      AND indexname = 'marriage_confirmations_initiatorUserId_partnerUserId_marriageDa'
  ) THEN
    ALTER INDEX "marriage_confirmations_initiatorUserId_partnerUserId_marriageDa"
      RENAME TO "marriage_confirmations_initiator_partner_date_key";
  END IF;
END $$;
