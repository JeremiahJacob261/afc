-- Deploy before the application. No account is assigned NGN in this stage.
ALTER TABLE public.users DROP CONSTRAINT users_account_currency_valid;
ALTER TABLE public.users ADD CONSTRAINT users_account_currency_valid
  CHECK (currency_code IN ('USDT','MMK','FCFA','ZMW','NGN'));
ALTER TABLE public.users ADD CONSTRAINT users_ngn_country_valid
  CHECK (currency_code <> 'NGN' OR country_iso IS NOT DISTINCT FROM 'NG');

CREATE OR REPLACE FUNCTION private.set_transaction_account_currency()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE currency text; units numeric;
BEGIN
 SELECT currency_code INTO currency FROM public.users WHERE username=NEW.username;
 units:=CASE currency WHEN 'USDT' THEN 1 WHEN 'MMK' THEN 5000 WHEN 'FCFA' THEN 600 WHEN 'ZMW' THEN 20 WHEN 'NGN' THEN 1350 END;
 NEW.account_currency:=currency;
 NEW.account_units_per_usdt:=units;
 NEW.account_amount:=NULL;
 IF units IS NULL THEN NEW.account_conversion_status:='missing_user_currency';
 ELSIF lower(coalesce(NEW.type,''))='deposit' THEN
   IF NEW.method_rate IS NULL OR NEW.method_rate<=0 THEN NEW.account_conversion_status:='missing_payment_rate';
   ELSE NEW.account_amount:=NEW.amount/NEW.method_rate*units; NEW.account_conversion_status:='ready'; END IF;
 ELSE NEW.account_amount:=NEW.amount/5000*units; NEW.account_conversion_status:='ready';
 END IF;
 RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION private.withdrawal_limits_in_mmk(code text, s admin_settings)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE rate numeric; item jsonb; result jsonb; field text; value numeric;
BEGIN
  rate := CASE code WHEN 'MMK' THEN 5000 WHEN 'USDT' THEN 1 WHEN 'FCFA' THEN 600 WHEN 'ZMW' THEN 20 WHEN 'NGN' THEN 1350 ELSE NULL END;
  IF rate IS NULL THEN RAISE EXCEPTION 'Invalid account currency'; END IF;
  IF s.withdrawal_currency_limits IS NULL THEN
    RETURN jsonb_build_object('minimum',s.min_withdrawal_amount,'perRequest',500000,'daily',s.daily_withdrawal_limit,'annual',s.max_withdrawal_amount);
  END IF;
  item:=s.withdrawal_currency_limits->code;
  -- Existing installations may not have saved NGN settings yet.
  IF code='NGN' AND item IS NULL THEN
    item:=jsonb_build_object('minimum',(s.withdrawal_currency_limits->'MMK'->>'minimum')::numeric * 1350 / 5000,
      'perRequest',(s.withdrawal_currency_limits->'MMK'->>'perRequest')::numeric * 1350 / 5000,
      'daily',(s.withdrawal_currency_limits->'MMK'->>'daily')::numeric * 1350 / 5000,
      'annual',(s.withdrawal_currency_limits->'MMK'->>'annual')::numeric * 1350 / 5000);
  END IF;
  IF jsonb_typeof(item) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Withdrawal limits are not configured for %',code; END IF;
  result:='{}'::jsonb;
  FOREACH field IN ARRAY ARRAY['minimum','perRequest','daily','annual'] LOOP
    IF jsonb_typeof(item->field) IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid withdrawal limits for %',code; END IF;
    value:=(item->>field)::numeric;
    IF value<0 OR value::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid withdrawal limits for %',code; END IF;
    result:=result||jsonb_build_object(field,value*5000/rate);
  END LOOP;
  IF (result->>'minimum')::numeric > LEAST((result->>'perRequest')::numeric,(result->>'daily')::numeric,(result->>'annual')::numeric) THEN
    RAISE EXCEPTION 'Invalid withdrawal limits for %',code;
  END IF;
  RETURN result;
END; $function$
;


