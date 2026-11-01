-- Account currency is a presentation/payment unit. The shared ledger remains MMK.
-- Existing funds are represented at exactly 5000 MMK = 1 USDT = 600 FCFA = 20 ZMW.
BEGIN;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country_iso text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS currency_code text;

CREATE OR REPLACE FUNCTION private.country_currency(p_country text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT CASE upper(trim(p_country)) WHEN 'MM' THEN 'MMK' WHEN 'ZM' THEN 'ZMW'
 WHEN 'BJ' THEN 'FCFA' WHEN 'BF' THEN 'FCFA' WHEN 'CI' THEN 'FCFA' WHEN 'GW' THEN 'FCFA'
 WHEN 'ML' THEN 'FCFA' WHEN 'NE' THEN 'FCFA' WHEN 'SN' THEN 'FCFA' WHEN 'TG' THEN 'FCFA'
 WHEN 'CM' THEN 'FCFA' WHEN 'CF' THEN 'FCFA' WHEN 'TD' THEN 'FCFA' WHEN 'CG' THEN 'FCFA'
 WHEN 'GQ' THEN 'FCFA' WHEN 'GA' THEN 'FCFA' ELSE 'USDT' END;
$$;
CREATE OR REPLACE FUNCTION private.country_from_dial(p_dial text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
 SELECT CASE trim(p_dial) WHEN '+95' THEN 'MM' WHEN '+260' THEN 'ZM'
 WHEN '+229' THEN 'BJ' WHEN '+226' THEN 'BF' WHEN '+225' THEN 'CI' WHEN '+245' THEN 'GW'
 WHEN '+223' THEN 'ML' WHEN '+227' THEN 'NE' WHEN '+221' THEN 'SN' WHEN '+228' THEN 'TG'
 WHEN '+237' THEN 'CM' WHEN '+236' THEN 'CF' WHEN '+235' THEN 'TD' WHEN '+242' THEN 'CG'
 WHEN '+240' THEN 'GQ' WHEN '+241' THEN 'GA' ELSE CASE WHEN trim(p_dial) ~ '^[A-Za-z]{2}$' THEN upper(trim(p_dial)) END END;
$$;
REVOKE ALL ON FUNCTION private.country_currency(text), private.country_from_dial(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.country_currency(text), private.country_from_dial(text) TO service_role;

UPDATE public.users u SET country_iso = upper(a.raw_user_meta_data->>'country_iso')
FROM auth.users a WHERE a.id::text = u.userid AND u.country_iso IS NULL
 AND a.raw_user_meta_data->>'country_iso' ~ '^[A-Za-z]{2}$';
UPDATE public.users SET country_iso = private.country_from_dial(countrycode) WHERE country_iso IS NULL;
UPDATE public.users SET currency_code = private.country_currency(country_iso) WHERE currency_code IS NULL;
ALTER TABLE public.users ALTER COLUMN currency_code SET DEFAULT 'USDT';
ALTER TABLE public.users ALTER COLUMN currency_code SET NOT NULL;
ALTER TABLE public.users ADD CONSTRAINT users_account_currency_valid CHECK (currency_code IN ('USDT','MMK','FCFA','ZMW'));

CREATE FUNCTION public.provision_country_profile_atomic(
 p_userid text,p_email text,p_username text,p_phone text,p_countrycode text,p_refer text DEFAULT NULL,p_country_iso text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE result jsonb; iso text := upper(nullif(trim(p_country_iso),''));
BEGIN
 IF iso IS NOT NULL AND iso !~ '^[A-Z]{2}$' THEN RAISE EXCEPTION 'Invalid signup country'; END IF;
 result := public.provision_native_profile_atomic(p_userid,p_email,p_username,p_phone,p_countrycode,p_refer);
 IF coalesce((result->>'created')::boolean,false) THEN
   iso := coalesce(iso,private.country_from_dial(p_countrycode));
   UPDATE public.users SET country_iso=iso,currency_code=private.country_currency(iso) WHERE userid=p_userid;
 END IF;
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.provision_country_profile_atomic(text,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.provision_country_profile_atomic(text,text,text,text,text,text,text) TO service_role;

CREATE OR REPLACE FUNCTION private.provision_web_auth_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE metadata jsonb:=NEW.raw_user_meta_data; referral text;
BEGIN
 IF metadata->>'profile_version' IS DISTINCT FROM '2' THEN RETURN NEW; END IF;
 referral:=nullif(trim(metadata->>'refer'),'');
 IF referral IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.users WHERE newrefer=referral) THEN referral:=NULL; END IF;
 PERFORM public.provision_country_profile_atomic(NEW.id::text,NEW.email,metadata->>'displayName',
   metadata->>'phoneNumber',metadata->>'countrycode',referral,metadata->>'country_iso');
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.provision_web_auth_profile() FROM PUBLIC,anon,authenticated,service_role;
-- A client editing its profile cannot change its denomination after signup.
CREATE FUNCTION private.protect_account_currency() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF current_user NOT IN ('postgres','supabase_admin','service_role')
   AND (NEW.country_iso IS DISTINCT FROM OLD.country_iso OR NEW.currency_code IS DISTINCT FROM OLD.currency_code) THEN
   RAISE EXCEPTION 'Account currency cannot be changed';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.protect_account_currency() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER protect_account_currency BEFORE UPDATE OF country_iso,currency_code ON public.users
 FOR EACH ROW EXECUTE FUNCTION private.protect_account_currency();
COMMIT;
