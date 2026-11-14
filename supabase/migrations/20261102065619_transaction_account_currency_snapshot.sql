BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
LOCK TABLE public.users, public.notification IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE currency_repair_baseline ON COMMIT DROP AS
SELECT (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(id,amount,method,method_currency,method_rate,type,sent) ORDER BY id)::text,'')) FROM public.notification) payments,
       (SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY userid)::text,'')) FROM public.users u) users;
ALTER TABLE public.notification ADD COLUMN account_currency text;
ALTER TABLE public.notification ADD COLUMN account_amount numeric;
ALTER TABLE public.notification ADD COLUMN account_units_per_usdt numeric;
ALTER TABLE public.notification ADD COLUMN account_conversion_status text;

CREATE FUNCTION private.set_transaction_account_currency() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE currency text; units numeric;
BEGIN
 SELECT currency_code INTO currency FROM public.users WHERE username=NEW.username;
 units:=CASE currency WHEN 'USDT' THEN 1 WHEN 'MMK' THEN 5000 WHEN 'FCFA' THEN 600 WHEN 'ZMW' THEN 20 END;
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
END; $$;
REVOKE ALL ON FUNCTION private.set_transaction_account_currency() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER set_transaction_account_currency BEFORE INSERT OR UPDATE ON public.notification
 FOR EACH ROW EXECUTE FUNCTION private.set_transaction_account_currency();

CREATE FUNCTION private.refresh_transaction_account_currency() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 UPDATE public.notification SET account_currency=NEW.currency_code WHERE username=NEW.username;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.refresh_transaction_account_currency() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER refresh_transaction_account_currency AFTER UPDATE OF currency_code ON public.users
 FOR EACH ROW WHEN (OLD.currency_code IS DISTINCT FROM NEW.currency_code)
 EXECUTE FUNCTION private.refresh_transaction_account_currency();

-- Does not touch sent, so this cannot resend transaction push notifications.
UPDATE public.notification SET account_currency=account_currency;
DO $$ BEGIN
 IF (SELECT payments FROM currency_repair_baseline) IS DISTINCT FROM
    (SELECT md5(coalesce(jsonb_agg(jsonb_build_array(id,amount,method,method_currency,method_rate,type,sent) ORDER BY id)::text,'')) FROM public.notification)
 OR (SELECT users FROM currency_repair_baseline) IS DISTINCT FROM
    (SELECT md5(coalesce(jsonb_agg(to_jsonb(u) ORDER BY userid)::text,'')) FROM public.users u) THEN
   RAISE EXCEPTION 'Currency repair changed original payment records or user balances';
 END IF;
END; $$;
COMMIT;
