-- Apply this patch to the Supabase database before deploying the API changes.
-- It adds atomic payment RPCs and the small metadata columns they need.

ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit DECIMAL(15, 4) DEFAULT 0.00;
ALTER TABLE users ADD COLUMN IF NOT EXISTS totalw DECIMAL(15, 4) DEFAULT 0.00;

CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  first_deposit_bonus_percent DECIMAL(6, 3) NOT NULL DEFAULT 3.000,
  min_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 10.000,
  max_withdrawal_amount DECIMAL(15, 3) NOT NULL DEFAULT 100000.000,
  withdrawal_fee_percent DECIMAL(6, 3) NOT NULL DEFAULT 7.000,
  withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS daily_withdrawal_limit DECIMAL(15, 3) NOT NULL DEFAULT 100.000 CHECK (daily_withdrawal_limit >= 0);
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_limit_exempt_usernames TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawals_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE admin_settings ADD COLUMN IF NOT EXISTS withdrawal_disabled_message TEXT NOT NULL DEFAULT 'Withdrawals are temporarily unavailable. Please try again later.';
INSERT INTO admin_settings (id, daily_withdrawal_limit, withdrawal_limit_exempt_usernames)
VALUES (1, 100.000, '{}') ON CONFLICT (id) DO NOTHING;

ALTER TABLE notification ADD COLUMN IF NOT EXISTS uid TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_action TEXT;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMP;
ALTER TABLE notification ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS reading (
  id BIGINT PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bets DECIMAL(15, 4) DEFAULT 0.00,
  deposit DECIMAL(15, 4) DEFAULT 0.00,
  withdraw DECIMAL(15, 4) DEFAULT 0.00,
  bet DECIMAL(15, 4) DEFAULT 0.00,
  won DECIMAL(15, 4) DEFAULT 0.00
);

INSERT INTO reading (id, bets, deposit, withdraw, bet, won)
VALUES (1, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_notification_uid ON notification(uid);
CREATE INDEX IF NOT EXISTS idx_notification_processed_at ON notification(processed_at);
CREATE INDEX IF NOT EXISTS idx_notification_withdrawal_limit ON notification(username, created_at) WHERE lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer');

CREATE OR REPLACE FUNCTION public.process_finance_action_atomic(
  p_action TEXT,
  p_id BIGINT DEFAULT NULL,
  p_uid TEXT DEFAULT NULL,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_first_deposit_bonus_percent NUMERIC DEFAULT 3
)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  notification_row notification%ROWTYPE;
  user_row users%ROWTYPE;
  current_sent TEXT;
  normalized_type TEXT;
  final_sent TEXT;
  deposit_amount NUMERIC;
  withdraw_amount NUMERIC;
  refund_amount NUMERIC;
  notification_amount NUMERIC;
  first_deposit_bonus NUMERIC;
  referral_bonus NUMERIC;
  bonus_percent NUMERIC;
BEGIN
  p_action := lower(btrim(COALESCE(p_action, '')));

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid finance action';
  END IF;

  IF p_id IS NULL AND (p_uid IS NULL OR btrim(p_uid) = '') THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF p_id IS NOT NULL THEN
    SELECT * INTO notification_row FROM notification WHERE id = p_id FOR UPDATE;
  ELSE
    SELECT * INTO notification_row FROM notification WHERE uid::TEXT = p_uid FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  current_sent := lower(COALESCE(notification_row.sent, 'pending'));
  normalized_type := lower(COALESCE(notification_row.type, ''));

  BEGIN
    notification_amount := NULLIF(notification_row.amount::TEXT, '')::NUMERIC;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid transaction amount';
  END;

  IF current_sent IN ('success', 'true', 'completed') THEN
    IF p_action = 'approve' THEN
      RETURN jsonb_build_object('status', 'success', 'sent', 'success', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent IN ('failed', 'false') THEN
    IF p_action = 'reject' THEN
      RETURN jsonb_build_object('status', 'success', 'sent', 'failed', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent = 'processing' THEN
    RAISE EXCEPTION 'Transaction already being processed';
  END IF;

  IF normalized_type NOT IN ('deposit', 'withdraw', 'withdrawer') THEN
    RAISE EXCEPTION 'Unsupported transaction type';
  END IF;

  SELECT * INTO user_row FROM users WHERE username = notification_row.username FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE notification
  SET processing_started_at = COALESCE(processing_started_at, now())
  WHERE id = notification_row.id;

  IF p_action = 'reject' THEN
    IF normalized_type IN ('withdraw', 'withdrawer') THEN
      refund_amount := round((COALESCE(notification_amount, 0) / 0.95)::NUMERIC, 3);
      IF refund_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid transaction amount';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + refund_amount
      WHERE username = notification_row.username;
    END IF;

    final_sent := 'failed';
  ELSE
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 THEN
      RAISE EXCEPTION 'Invalid transaction amount';
    END IF;

    IF normalized_type = 'deposit' THEN
      deposit_amount := round(p_approved_amount::NUMERIC, 3);
      bonus_percent := COALESCE(p_first_deposit_bonus_percent, 3);

      IF bonus_percent < 0 OR bonus_percent > 100 THEN
        RAISE EXCEPTION 'First deposit bonus percent must be between 0 and 100';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + deposit_amount,
          totald = COALESCE(totald, 0) + deposit_amount,
          deposit = COALESCE(deposit, 0) + 1
      WHERE username = notification_row.username;

      UPDATE reading
      SET deposit = COALESCE(deposit, 0) + deposit_amount
      WHERE id = 1;

      IF COALESCE(user_row.firstd, FALSE) IS FALSE THEN
        first_deposit_bonus := round(((deposit_amount * bonus_percent) / 100)::NUMERIC, 3);

        IF first_deposit_bonus > 0 THEN
          UPDATE users
          SET balance = COALESCE(balance, 0) + first_deposit_bonus
          WHERE username = notification_row.username;

          INSERT INTO activa (code, username, type, amount)
          VALUES ('firstdepositbonus', notification_row.username, 'depbonus', first_deposit_bonus);
        END IF;

        referral_bonus := round((deposit_amount * 0.05)::NUMERIC, 3);

        UPDATE users
        SET balance = COALESCE(balance, 0) + referral_bonus
        WHERE newrefer = user_row.refer;

        INSERT INTO activa (username, type, amount, code)
        VALUES (notification_row.username, 'depbonus', referral_bonus, user_row.refer);

        UPDATE users
        SET firstd = TRUE
        WHERE username = notification_row.username;
      END IF;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'deposit', deposit_amount);
    ELSE
      withdraw_amount := round(p_approved_amount::NUMERIC, 3);

      UPDATE users
      SET totalw = COALESCE(totalw, 0) + withdraw_amount
      WHERE username = notification_row.username;

      UPDATE reading
      SET withdraw = COALESCE(withdraw, 0) + withdraw_amount
      WHERE id = 1;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'withdraw', COALESCE(notification_amount, 0));
    END IF;

    final_sent := 'success';
  END IF;

  UPDATE notification
  SET sent = final_sent,
      processed_action = p_action,
      processed_at = now()
  WHERE id = notification_row.id;

  RETURN jsonb_build_object('status', 'success', 'sent', final_sent, 'alreadyProcessed', FALSE, 'transactionId', notification_row.id);
END;
$$;

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

  SELECT * INTO user_row FROM users WHERE userid = p_userid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- The immutable $100 cap applies to everyone, including exempt users.
  IF p_payout_amount > 100 THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is 100 USDT';
  END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    -- Boundaries are calculated in UTC, so limits reset automatically at 00:00 UTC.
    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));

    SELECT COALESCE(SUM(amount), 0) INTO daily_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_day_start;

    IF daily_total + p_payout_amount > settings_row.daily_withdrawal_limit THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % USDT reached', settings_row.daily_withdrawal_limit;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO annual_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_year_start;

    IF annual_total + p_payout_amount > settings_row.max_withdrawal_amount THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % USDT reached', settings_row.max_withdrawal_amount;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  INSERT INTO notification (address, username, amount, sent, type, method, bank, accountname)
  VALUES (p_wallet, user_row.username, round(p_payout_amount::NUMERIC, 3), 'pending', 'withdraw', p_method, p_bank, p_accountname)
  RETURNING id INTO inserted_id;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_amount
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  RETURN jsonb_build_object('status', 'success', 'notificationId', inserted_id, 'balance', next_balance);
END;
$$;

REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM anon;
REVOKE ALL ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) FROM authenticated;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_finance_action_atomic(TEXT, BIGINT, TEXT, NUMERIC, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_withdrawal_request_atomic(TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;
