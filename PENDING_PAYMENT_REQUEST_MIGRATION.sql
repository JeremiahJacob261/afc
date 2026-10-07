-- One pending payment request per user across deposits and withdrawals.
-- The unique index enforces this under concurrent submissions and for any writer.
CREATE UNIQUE INDEX IF NOT EXISTS one_pending_payment_request_per_user
ON public.notification (lower(btrim(username)))
WHERE lower(coalesce(type, '')) IN ('deposit', 'withdraw', 'withdrawer')
  AND lower(coalesce(sent, 'pending')) IN ('pending', 'processing');
