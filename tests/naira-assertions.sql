DO $$ DECLARE settings public.admin_settings%ROWTYPE; l jsonb; BEGIN
 IF private.country_currency('NG') <> 'NGN' OR private.country_from_dial('+234') <> 'NG' OR private.country_currency('GB') <> 'USDT' THEN RAISE EXCEPTION 'Country assignment incorrect'; END IF;
 IF (SELECT currency_code FROM public.users WHERE userid='ng-iso') <> 'NGN'
 OR (SELECT currency_code FROM public.users WHERE userid='ng-dial') <> 'NGN'
 OR (SELECT currency_code FROM public.users WHERE userid='gb') <> 'USDT' THEN RAISE EXCEPTION 'Nigerian account migration incorrect'; END IF;
 IF (SELECT balance FROM public.users WHERE userid='ng-iso') <> 50000 THEN RAISE EXCEPTION 'Ledger balance changed'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.notification WHERE username='fixture_ng' AND type='withdraw' AND amount=5000 AND account_currency='NGN' AND account_amount=1350 AND sent='completed') THEN RAISE EXCEPTION 'Withdrawal history conversion incorrect'; END IF;
 IF NOT EXISTS (SELECT 1 FROM public.notification WHERE username='fixture_ng' AND type='deposit' AND amount=10 AND account_amount=13500 AND account_conversion_status='ready') THEN RAISE EXCEPTION 'Deposit history conversion incorrect'; END IF;
 SELECT * INTO settings FROM public.admin_settings WHERE id=1;
 l:=private.withdrawal_limits_in_mmk('NGN',settings);
 IF (l->>'minimum')::numeric<>60000 OR (l->>'perRequest')::numeric<>700000 OR (l->>'daily')::numeric<>900000 OR (l->>'annual')::numeric<>600000000 THEN RAISE EXCEPTION 'NGN withdrawal defaults incorrect'; END IF;
 BEGIN
   UPDATE public.users SET currency_code='NGN' WHERE userid='gb';
   RAISE EXCEPTION 'Non-Nigerian account accepted NGN';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
