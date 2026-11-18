-- Activate after the application understands NGN and old-client compatibility.
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='30s';
LOCK TABLE public.users, public.notification, public.admin_settings IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE ngn_ledger_baseline ON COMMIT DROP AS
SELECT (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(userid,balance,totald,totalw) ORDER BY userid)::text,'')) FROM public.users) AS balances,
       (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(id,amount,method,method_currency,method_rate,type,sent) ORDER BY id)::text,'')) FROM public.notification) AS payments;

CREATE OR REPLACE FUNCTION private.country_currency(p_country text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 SELECT CASE upper(trim(p_country)) WHEN 'MM' THEN 'MMK' WHEN 'ZM' THEN 'ZMW' WHEN 'NG' THEN 'NGN'
 WHEN 'BJ' THEN 'FCFA' WHEN 'BF' THEN 'FCFA' WHEN 'CI' THEN 'FCFA' WHEN 'GW' THEN 'FCFA'
 WHEN 'ML' THEN 'FCFA' WHEN 'NE' THEN 'FCFA' WHEN 'SN' THEN 'FCFA' WHEN 'TG' THEN 'FCFA'
 WHEN 'CM' THEN 'FCFA' WHEN 'CF' THEN 'FCFA' WHEN 'TD' THEN 'FCFA' WHEN 'CG' THEN 'FCFA'
 WHEN 'GQ' THEN 'FCFA' WHEN 'GA' THEN 'FCFA' ELSE 'USDT' END;
$function$
;

CREATE OR REPLACE FUNCTION private.country_from_dial(p_dial text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
 SELECT CASE trim(p_dial) WHEN '+95' THEN 'MM' WHEN '+260' THEN 'ZM' WHEN '+234' THEN 'NG'
 WHEN '+229' THEN 'BJ' WHEN '+226' THEN 'BF' WHEN '+225' THEN 'CI' WHEN '+245' THEN 'GW'
 WHEN '+223' THEN 'ML' WHEN '+227' THEN 'NE' WHEN '+221' THEN 'SN' WHEN '+228' THEN 'TG'
 WHEN '+237' THEN 'CM' WHEN '+236' THEN 'CF' WHEN '+235' THEN 'TD' WHEN '+242' THEN 'CG'
 WHEN '+240' THEN 'GQ' WHEN '+241' THEN 'GA' ELSE CASE WHEN trim(p_dial) ~ '^[A-Za-z]{2}$' THEN upper(trim(p_dial)) END END;
$function$
;

-- Add the new configurable limits without changing any existing currency.
UPDATE public.admin_settings
SET withdrawal_currency_limits = jsonb_set(withdrawal_currency_limits,'{NGN}',
  jsonb_build_object(
    'minimum', (withdrawal_currency_limits->'MMK'->>'minimum')::numeric*1350/5000,
    'perRequest',(withdrawal_currency_limits->'MMK'->>'perRequest')::numeric*1350/5000,
    'daily',(withdrawal_currency_limits->'MMK'->>'daily')::numeric*1350/5000,
    'annual',(withdrawal_currency_limits->'MMK'->>'annual')::numeric*1350/5000))
WHERE id=1 AND withdrawal_currency_limits IS NOT NULL AND NOT withdrawal_currency_limits ? 'NGN';

-- Explicit Nigeria or an unambiguous Nigerian calling code only.
UPDATE public.users SET country_iso='NG', currency_code='NGN'
WHERE currency_code='USDT' AND (country_iso='NG' OR (country_iso IS NULL AND countrycode='+234'));

DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.admin_settings s WHERE id=1 AND withdrawal_currency_limits IS NOT NULL
   AND private.withdrawal_limits_in_mmk('NGN',s) IS NULL) THEN
   RAISE EXCEPTION 'NGN withdrawal settings invalid';
 END IF;
 IF (SELECT balances FROM ngn_ledger_baseline) IS DISTINCT FROM
    (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(userid,balance,totald,totalw) ORDER BY userid)::text,'')) FROM public.users)
 OR (SELECT payments FROM ngn_ledger_baseline) IS DISTINCT FROM
    (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(id,amount,method,method_currency,method_rate,type,sent) ORDER BY id)::text,'')) FROM public.notification) THEN
   RAISE EXCEPTION 'NGN activation changed ledger balances or original payments';
 END IF;
END; $$;
COMMIT;

