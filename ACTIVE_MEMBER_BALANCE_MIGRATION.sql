-- Make active-member eligibility depend on current balance.
-- Apply once to an existing Supabase database.

BEGIN;

ALTER TABLE public.admin_settings
  ADD COLUMN IF NOT EXISTS membership_balance_threshold DECIMAL(15, 3) NOT NULL DEFAULT 1000.000
  CHECK (membership_balance_threshold >= 0);

INSERT INTO public.admin_settings (id, membership_balance_threshold)
VALUES (1, 1000.000)
ON CONFLICT (id) DO NOTHING;

UPDATE public.admin_settings
SET membership_balance_threshold = COALESCE(membership_balance_threshold, 1000.000)
WHERE id = 1;

CREATE INDEX IF NOT EXISTS idx_users_refer_balance
  ON public.users(refer, balance);

CREATE INDEX IF NOT EXISTS idx_users_lvla_balance
  ON public.users(lvla, balance);

CREATE INDEX IF NOT EXISTS idx_users_lvlb_balance
  ON public.users(lvlb, balance);

CREATE OR REPLACE FUNCTION public.active_member_balance_threshold()
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT membership_balance_threshold FROM public.admin_settings WHERE id = 1),
    1000
  )::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.is_active_member(p_balance NUMERIC)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p_balance, 0)::NUMERIC >= public.active_member_balance_threshold();
$$;

-- Update already-installed SQL functions without duplicating their full bodies.
DO $$
DECLARE
  function_sql TEXT;
BEGIN
  SELECT pg_get_functiondef(p.oid)
  INTO function_sql
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'apply_vip_daily_rewards'
  ORDER BY p.oid DESC
  LIMIT 1;

  IF function_sql IS NOT NULL THEN
    function_sql := replace(function_sql, 'downline.firstd IS TRUE', 'public.is_active_member(downline.balance)');
    function_sql := replace(function_sql, 'downline.firstd = TRUE', 'public.is_active_member(downline.balance)');
    function_sql := replace(function_sql, 'downline.firstd is true', 'public.is_active_member(downline.balance)');
    function_sql := replace(function_sql, 'downline.firstd = true', 'public.is_active_member(downline.balance)');
    EXECUTE function_sql;
  END IF;

  SELECT pg_get_functiondef(p.oid)
  INTO function_sql
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'place_bet_atomic'
  ORDER BY p.oid DESC
  LIMIT 1;

  IF function_sql IS NOT NULL THEN
    function_sql := replace(function_sql, 'AND firstd IS TRUE', 'AND public.is_active_member(balance)');
    function_sql := replace(function_sql, 'AND firstd = TRUE', 'AND public.is_active_member(balance)');
    function_sql := replace(function_sql, 'AND firstd is true', 'AND public.is_active_member(balance)');
    function_sql := replace(function_sql, 'AND firstd = true', 'AND public.is_active_member(balance)');
    EXECUTE function_sql;
  END IF;
END $$;

COMMIT;
