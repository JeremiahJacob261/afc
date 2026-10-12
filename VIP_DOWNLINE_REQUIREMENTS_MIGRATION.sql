-- Current MMK VIP eligibility. Direct downlines are counted by the callers
-- using the configured active-member balance threshold.
-- Deposit requirements and reward rates are unchanged.
BEGIN;

CREATE OR REPLACE FUNCTION public.vip_level_for_user(total_deposit numeric, referral_count integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT CASE
    WHEN COALESCE(total_deposit, 0) >= 2500000 AND COALESCE(referral_count, 0) >= 30 THEN 7
    WHEN COALESCE(total_deposit, 0) >= 1500000 AND COALESCE(referral_count, 0) >= 25 THEN 6
    WHEN COALESCE(total_deposit, 0) >= 1000000 AND COALESCE(referral_count, 0) >= 20 THEN 5
    WHEN COALESCE(total_deposit, 0) >= 500000 AND COALESCE(referral_count, 0) >= 15 THEN 4
    WHEN COALESCE(total_deposit, 0) >= 250000 AND COALESCE(referral_count, 0) >= 10 THEN 3
    WHEN COALESCE(total_deposit, 0) >= 100000 AND COALESCE(referral_count, 0) >= 5 THEN 2
    ELSE 1
  END;
$function$;

COMMIT;
