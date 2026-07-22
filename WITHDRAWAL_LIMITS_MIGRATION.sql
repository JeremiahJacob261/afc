-- Run this entire file once in the Supabase SQL Editor.
-- It preserves existing settings and withdrawal records.

CREATE TABLE IF NOT EXISTS public.admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  first_deposit_bonus_percent DECIMAL(6, 3) NOT NULL DEFAULT 3.000,
  min_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 6000.000,
  max_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 60000000.000,
  withdrawal_fee_percent DECIMAL(6, 3) NOT NULL DEFAULT 7.000,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 60000.000 CHECK (daily_withdrawal_limit >= 0),
  ADD COLUMN IF NOT EXISTS withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}';

-- Do not overwrite any existing admin configuration.
INSERT INTO public.admin_settings (id, daily_withdrawal_limit, withdrawal_limit_exempt_usernames)
VALUES (1, 60000.000, '{}')
ON CONFLICT (id) DO NOTHING;

-- Needed to calculate limits for older installations that do not yet have it.
ALTER TABLE public.notification
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit
  ON public.notification (username, created_at)
  WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_atomic(
  p_userid TEXT,
  p_amount NUMERIC,
  p_payout_amount NUMERIC,
  p_wallet TEXT DEFAULT NULL,
  p_method TEXT DEFAULT NULL,
  p_bank TEXT DEFAULT NULL,
  p_accountname TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  next_balance NUMERIC;
  inserted_id BIGINT;
  daily_total NUMERIC;
  annual_total NUMERIC;
  is_limit_exempt BOOLEAN;
  utc_day_start TIMESTAMP;
  utc_year_start TIMESTAMP;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_payout_amount IS NULL OR p_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  -- Locking the user row makes concurrent requests from the same user safe.
  SELECT * INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- This per-request cap applies to everyone, including exempt usernames.
  IF p_payout_amount > 60000 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 60,000 FCFA';
  END IF;

  SELECT * INTO settings_row
  FROM admin_settings
  WHERE id = 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    -- UTC boundaries make the daily allowance reset automatically at 00:00 UTC.
    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));

    SELECT COALESCE(SUM(amount), 0) INTO daily_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_day_start;

    IF daily_total + p_payout_amount > settings_row.daily_withdrawal_limit THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % FCFA reached', settings_row.daily_withdrawal_limit;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO annual_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_year_start;

    IF annual_total + p_payout_amount > settings_row.max_withdrawal_amount THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % FCFA reached', settings_row.max_withdrawal_amount;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  INSERT INTO notification (address, username, amount, sent, type, method, bank, accountname)
  VALUES (
    p_wallet,
    user_row.username,
    round(p_payout_amount::NUMERIC, 3),
    'pending',
    'withdraw',
    p_method,
    p_bank,
    p_accountname
  )
  RETURNING id INTO inserted_id;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_amount
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  RETURN jsonb_build_object(
    'status', 'success',
    'notificationId', inserted_id,
    'balance', next_balance
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;
