-- Run before deploying the payment-rate snapshot API changes.
-- Pending transactions keep the rate selected at request time, rather than
-- depending on a payment method that may latera be edited or deleted.

ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS method_currency TEXT,
  ADD COLUMN IF NOT EXISTS method_rate DECIMAL(20, 8);

-- FCFA aliases have a stable 1:1 rate and can be safely backfilled. Other
-- legacy rows intentionally remain NULL so they require an explicit review.
UPDATE public.notification
SET method_currency = 'FCFA',
    method_rate = 1
WHERE method_rate IS NULL
  AND lower(regexp_replace(COALESCE(method, ''), '[()_-]+', ' ', 'g'))
    ~ '(^| )(fcfa|xof|cfa)( |$)';

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(
  p_userid TEXT,
  p_amount NUMERIC,
  p_payout_amount NUMERIC,
  p_wallet TEXT,
  p_method TEXT,
  p_bank TEXT,
  p_accountname TEXT,
  p_method_currency TEXT,
  p_method_rate NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  inserted_id BIGINT;
  next_balance NUMERIC;
  daily_total NUMERIC;
  annual_total NUMERIC;
  is_limit_exempt BOOLEAN;
  utc_day_start TIMESTAMP;
  utc_year_start TIMESTAMP;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 OR p_payout_amount IS NULL OR p_payout_amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF p_method_currency IS NULL OR btrim(p_method_currency) = '' OR p_method_rate IS NULL OR p_method_rate <= 0 THEN RAISE EXCEPTION 'Invalid payment method rate'; END IF;

  SELECT * INTO user_row FROM users WHERE userid = p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF p_payout_amount > 60000 THEN RAISE EXCEPTION 'Maximum amount to withdraw is 60,000 FCFA'; END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal settings are not configured'; END IF;
  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1 FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );
  IF NOT is_limit_exempt THEN
    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));
    SELECT COALESCE(SUM(amount), 0) INTO daily_total FROM notification
    WHERE username = user_row.username AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected') AND created_at >= utc_day_start;
    IF daily_total + p_payout_amount > settings_row.daily_withdrawal_limit THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % FCFA reached', settings_row.daily_withdrawal_limit;
    END IF;
    SELECT COALESCE(SUM(amount), 0) INTO annual_total FROM notification
    WHERE username = user_row.username AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected') AND created_at >= utc_year_start;
    IF annual_total + p_payout_amount > settings_row.max_withdrawal_amount THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % FCFA reached', settings_row.max_withdrawal_amount;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN RAISE EXCEPTION 'Insufficient funds'; END IF;
  INSERT INTO notification (address, username, amount, sent, type, method, method_currency, method_rate, bank, accountname)
  VALUES (p_wallet, user_row.username, round(p_payout_amount::NUMERIC, 3), 'pending', 'withdraw', p_method, p_method_currency, p_method_rate, p_bank, p_accountname)
  RETURNING id INTO inserted_id;

  UPDATE users SET balance = COALESCE(balance, 0) - p_amount WHERE username = user_row.username RETURNING balance INTO next_balance;
  RETURN jsonb_build_object('status', 'success', 'notificationId', inserted_id, 'balance', next_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC) TO service_role;
