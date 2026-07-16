-- VIP daily balance rewards
-- Apply once to an existing Supabase database.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE TABLE IF NOT EXISTS public.vip_daily_rewards (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL REFERENCES public.users(username),
  reward_date DATE NOT NULL,
  vip_level INTEGER NOT NULL,
  daily_rate DECIMAL(8, 6) NOT NULL,
  balance_before DECIMAL(15, 4) NOT NULL,
  amount DECIMAL(15, 4) NOT NULL,
  balance_after DECIMAL(15, 4) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(username, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_vip_daily_rewards_date
  ON public.vip_daily_rewards(reward_date);

CREATE OR REPLACE FUNCTION public.vip_level_for_user(total_deposit NUMERIC, referral_count INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN COALESCE(total_deposit, 0) >= 500 AND COALESCE(referral_count, 0) >= 20 THEN 7
    WHEN COALESCE(total_deposit, 0) >= 300 AND COALESCE(referral_count, 0) >= 15 THEN 6
    WHEN COALESCE(total_deposit, 0) >= 200 AND COALESCE(referral_count, 0) >= 12 THEN 5
    WHEN COALESCE(total_deposit, 0) >= 100 AND COALESCE(referral_count, 0) >= 8 THEN 4
    WHEN COALESCE(total_deposit, 0) >= 50 AND COALESCE(referral_count, 0) >= 5 THEN 3
    WHEN COALESCE(total_deposit, 0) >= 20 AND COALESCE(referral_count, 0) >= 3 THEN 2
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public.vip_daily_rate_for_level(vip_level INTEGER)
RETURNS NUMERIC
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE vip_level
    WHEN 2 THEN 0.0015
    WHEN 3 THEN 0.0030
    WHEN 4 THEN 0.0050
    WHEN 5 THEN 0.0070
    WHEN 6 THEN 0.0095
    WHEN 7 THEN 0.0125
    ELSE 0
  END::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.apply_vip_daily_rewards(
  p_reward_date DATE DEFAULT (timezone('UTC', now()))::DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_row RECORD;
  reward_id BIGINT;
  vip_level INTEGER;
  daily_rate NUMERIC;
  reward_amount NUMERIC;
  next_balance NUMERIC;
  processed_count INTEGER := 0;
  total_amount NUMERIC := 0;
BEGIN
  FOR user_row IN
    SELECT
      u.id,
      u.username,
      COALESCE(u.totald, 0)::NUMERIC AS total_deposit,
      COALESCE(u.balance, 0)::NUMERIC AS current_balance,
      (
        SELECT COUNT(*)::INTEGER
        FROM public.users downline
        WHERE downline.refer = u.newrefer
          AND downline.firstd IS TRUE
      ) AS active_downlines
    FROM public.users u
    FOR UPDATE OF u
  LOOP
    vip_level := public.vip_level_for_user(user_row.total_deposit, user_row.active_downlines);
    daily_rate := public.vip_daily_rate_for_level(vip_level);

    IF daily_rate <= 0 OR user_row.current_balance <= 0 THEN
      CONTINUE;
    END IF;

    reward_amount := round((user_row.current_balance * daily_rate)::NUMERIC, 4);
    IF reward_amount <= 0 THEN
      CONTINUE;
    END IF;

    reward_id := NULL;
    INSERT INTO public.vip_daily_rewards (
      username, reward_date, vip_level, daily_rate,
      balance_before, amount, balance_after
    )
    VALUES (
      user_row.username, p_reward_date, vip_level, daily_rate,
      user_row.current_balance, reward_amount,
      user_row.current_balance + reward_amount
    )
    ON CONFLICT (username, reward_date) DO NOTHING
    RETURNING id INTO reward_id;

    IF reward_id IS NULL THEN
      CONTINUE;
    END IF;

    UPDATE public.users
    SET balance = COALESCE(balance, 0) + reward_amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = user_row.id
    RETURNING balance INTO next_balance;

    UPDATE public.vip_daily_rewards
    SET balance_after = next_balance
    WHERE id = reward_id;

    INSERT INTO public.activa (code, username, amount, type)
    VALUES ('vipdaily', user_row.username, reward_amount, 'vipbonus');

    processed_count := processed_count + 1;
    total_amount := total_amount + reward_amount;
  END LOOP;

  RETURN jsonb_build_object(
    'rewardDate', p_reward_date,
    'processedCount', processed_count,
    'totalAmount', round(total_amount::NUMERIC, 4)
  );
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job
    WHERE jobname = 'apply-vip-daily-rewards-utc'
  ) THEN
    PERFORM cron.unschedule('apply-vip-daily-rewards-utc');
  END IF;
END $$;

SELECT cron.schedule(
  'apply-vip-daily-rewards-utc',
  '0 0 * * *',
  $$SELECT public.apply_vip_daily_rewards();$$
);
