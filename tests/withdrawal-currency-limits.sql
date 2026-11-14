-- Run against an isolated fixture database. All changes are rolled back.
BEGIN;
INSERT INTO public.admin_settings(id,min_withdrawal_amount,max_withdrawal_amount,daily_withdrawal_limit,withdrawal_fee_percent,withdrawals_enabled,withdrawal_limit_exempt_usernames)
VALUES(1,50000,500000000,500000,7,true,ARRAY[]::text[]);
INSERT INTO public.users(userid,uid,username,balance,codeset,pin,currency_code)
VALUES('currency-usdt','currency-usdt','currency_usdt',2000000,true,'1234','USDT'),
      ('currency-mmk','currency-mmk','currency_mmk',2000000,true,'1234','MMK');
INSERT INTO public.walle(id,name,currency_code,rates,available) VALUES(1,'test-method','USDT',1,true);
INSERT INTO public.user_wallets(uid,wallet,walletnames,bank,names)
VALUES('currency-usdt','usdt-wallet','test-method','',''),('currency-mmk','mmk-wallet','test-method','','');

DO $$ DECLARE s public.admin_settings%ROWTYPE; limits jsonb; BEGIN
 SELECT * INTO s FROM public.admin_settings WHERE id=1;
 limits:=private.withdrawal_limits_in_mmk('USDT',s);
 IF (limits->>'minimum')::numeric<>50000 OR (limits->>'perRequest')::numeric<>500000 THEN RAISE EXCEPTION 'Fallback changed existing limits'; END IF;
END $$;

UPDATE public.admin_settings SET withdrawal_currency_limits='{
 "MMK":{"minimum":50000,"perRequest":500000,"daily":500000,"annual":500000000},
 "USDT":{"minimum":20,"perRequest":40,"daily":30,"annual":35},
 "FCFA":{"minimum":6000,"perRequest":60000,"daily":60000,"annual":60000000},
 "ZMW":{"minimum":200,"perRequest":2000,"daily":2000,"annual":2000000}
}'::jsonb WHERE id=1;

DO $$ DECLARE s public.admin_settings%ROWTYPE; limits jsonb; BEGIN
 SELECT * INTO s FROM public.admin_settings WHERE id=1;
 limits:=private.withdrawal_limits_in_mmk('FCFA',s);
 IF (limits->>'minimum')::numeric<>50000 OR (limits->>'perRequest')::numeric<>500000 THEN RAISE EXCEPTION 'FCFA conversion failed'; END IF;
 limits:=private.withdrawal_limits_in_mmk('ZMW',s);
 IF (limits->>'minimum')::numeric<>50000 OR (limits->>'perRequest')::numeric<>500000 THEN RAISE EXCEPTION 'ZMW conversion failed'; END IF;
 IF has_function_privilege('authenticated','private.withdrawal_limits_in_mmk(text,public.admin_settings)','EXECUTE') THEN RAISE EXCEPTION 'Client role has access to internal function'; END IF;
END $$;

SET LOCAL ROLE service_role;
DO $$ DECLARE result jsonb; BEGIN
 IF (public.read_payment_state('currency-usdt')->'profile'->>'currency_code') <> 'USDT' THEN RAISE EXCEPTION 'Account currency missing'; END IF;
 BEGIN
   PERFORM public.submit_withdrawal_atomic('currency-usdt',50000,'1234','usdt-wallet','test-method');
   RAISE EXCEPTION 'USDT minimum not enforced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Minimum amount%' THEN RAISE; END IF; END;
 BEGIN
   PERFORM public.submit_withdrawal_atomic('currency-usdt',205000,'1234','usdt-wallet','test-method');
   RAISE EXCEPTION 'USDT request maximum not enforced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Maximum amount%' THEN RAISE; END IF; END;
 BEGIN
   PERFORM public.submit_withdrawal_atomic('currency-usdt',155000,'1234','usdt-wallet','test-method');
   RAISE EXCEPTION 'USDT daily maximum not enforced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Daily withdrawal%' THEN RAISE; END IF; END;
 result:=public.submit_withdrawal_atomic('currency-usdt',100000,'1234','usdt-wallet','test-method',NULL,NULL,'ba7d14f5-7c28-48fa-9f11-2326b689b995');
 IF result->>'status'<>'success' THEN RAISE EXCEPTION 'Valid USDT withdrawal failed'; END IF;
 result:=public.submit_withdrawal_atomic('currency-usdt',100000,'1234','usdt-wallet','test-method',NULL,NULL,'ba7d14f5-7c28-48fa-9f11-2326b689b995');
 IF result->>'reused'<>'true' OR (SELECT balance FROM public.users WHERE userid='currency-usdt')<>1893000 THEN RAISE EXCEPTION 'Retry charged twice'; END IF;
 result:=public.submit_withdrawal_atomic('currency-mmk',50000,'1234','mmk-wallet','test-method');
 IF result->>'status'<>'success' THEN RAISE EXCEPTION 'MMK user was affected by USDT minimum'; END IF;
END $$;
RESET ROLE;

DELETE FROM public.notification WHERE username='currency_usdt';
UPDATE public.admin_settings SET withdrawal_currency_limits=jsonb_set(withdrawal_currency_limits,'{USDT,daily}','100') WHERE id=1;
INSERT INTO public.notification(username,amount,type,sent,created_at) VALUES('currency_usdt',80000,'withdraw','completed',date_trunc('year',now()) + interval '1 second');
SET LOCAL ROLE service_role;
DO $$ BEGIN
 BEGIN
   PERFORM public.submit_withdrawal_atomic('currency-usdt',100000,'1234','usdt-wallet','test-method');
   RAISE EXCEPTION 'USDT annual maximum not enforced';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Annual withdrawal%' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
ROLLBACK;
