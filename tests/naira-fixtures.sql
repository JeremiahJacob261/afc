-- Run only against an isolated database prepared with the previous schema.
INSERT INTO public.admin_settings(id,min_withdrawal_amount,max_withdrawal_amount,daily_withdrawal_limit,withdrawals_enabled,withdrawal_currency_limits)
VALUES(1,60000,600000000,900000,true,'{"MMK":{"minimum":60000,"perRequest":700000,"daily":900000,"annual":600000000},"USDT":{"minimum":10,"perRequest":100,"daily":100,"annual":100000},"FCFA":{"minimum":6000,"perRequest":60000,"daily":60000,"annual":60000000},"ZMW":{"minimum":200,"perRequest":2000,"daily":2000,"annual":2000000}}');
INSERT INTO public.users(userid,username,country_iso,countrycode,currency_code,balance,totald,totalw)
VALUES('ng-iso','fixture_ng','NG','+234','USDT',50000,25000,10000),
      ('ng-dial','fixture_ng_dial',NULL,'+234','USDT',5000,0,0),
      ('gb','fixture_gb','GB','+234','USDT',50000,0,0);
INSERT INTO public.notification(username,amount,type,sent,method,method_currency,method_rate)
VALUES('fixture_ng',5000,'withdraw','completed','USDT','USDT',1),
      ('fixture_ng',10,'deposit','success','USDT','USDT',1);
