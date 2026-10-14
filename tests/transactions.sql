-- Run against isolated PostgreSQL or inside a transaction-capable staging DB.
-- All users, money, matches, jobs and settings created here are rolled back.
BEGIN;
INSERT INTO public.admin_settings(id,min_withdrawal_amount,max_withdrawal_amount,daily_withdrawal_limit,
  withdrawal_fee_percent,membership_balance_threshold,withdrawals_enabled)
VALUES(1,50000,500000000,500000,7,8335,true)
ON CONFLICT(id) DO UPDATE SET min_withdrawal_amount=50000,max_withdrawal_amount=500000000,
  daily_withdrawal_limit=500000,withdrawal_fee_percent=7,membership_balance_threshold=8335,withdrawals_enabled=true;
INSERT INTO private.notification_worker_credentials(id,token_hash)
VALUES(true,extensions.digest(repeat('a',64),'sha256')) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash;

DO $$
DECLARE v_userid text:=gen_random_uuid()::text; uid2 text:=gen_random_uuid()::text;
  owner text:='txn_'||replace(v_userid,'-',''); owner2 text:='txn_'||replace(uid2,'-','');
  authid uuid:=gen_random_uuid(); method_id bigint; d jsonb; retry jsonb; result jsonb;
  deposit_id uuid:=gen_random_uuid(); withdrawal_id uuid:=gen_random_uuid(); notification_id bigint;
  original_balance numeric; wallet_id bigint; row public.notification_jobs%ROWTYPE; c integer;
BEGIN
  INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(authid,'txn_auth_'||authid||'@example.invalid',
    jsonb_build_object('profile_version',2,'displayName','auth_'||replace(authid::text,'-',''),'phoneNumber','9123456789','countrycode','+95'));
  IF NOT EXISTS(SELECT 1 FROM public.users WHERE userid=authid::text) THEN RAISE EXCEPTION 'Auth did not create profile atomically'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.notification_jobs WHERE event_key='team:'||authid::text) THEN RAISE EXCEPTION 'Signup did not enqueue team notification'; END IF;
  BEGIN
    INSERT INTO auth.users(id,email,raw_user_meta_data) VALUES(gen_random_uuid(),'another@example.invalid',
      jsonb_build_object('profile_version',2,'displayName','auth_'||replace(authid::text,'-',''),'phoneNumber','9123456789','countrycode','+95'));
    RAISE EXCEPTION 'Duplicate signup accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  IF EXISTS(SELECT 1 FROM auth.users WHERE email='another@example.invalid') THEN RAISE EXCEPTION 'Failed signup left orphaned Auth account'; END IF;

  PERFORM public.provision_native_profile_atomic(v_userid,owner||'@example.invalid',owner,'9123456789','+95',NULL);
  PERFORM public.provision_native_profile_atomic(uid2,owner2||'@example.invalid',owner2,'9123456789','+95',NULL);
  UPDATE public.users SET balance=2000000,codeset=true,pin='1234' WHERE userid IN (v_userid,uid2);
  INSERT INTO public.walle(name,currency_code,available,rates,type) VALUES('txn_usdt_'||v_userid,'usdt',true,1,'crypto') RETURNING id INTO method_id;
  INSERT INTO public.depositwallet(name,currency_code,address) VALUES('txn_usdt_'||v_userid,'usdt','txn_destination_'||v_userid);
  d:=public.create_deposit_request_atomic(v_userid,5,'usdt','txn_usdt_'||v_userid,'test_receipt_'||v_userid,'txn_destination_'||v_userid,1,deposit_id);
  UPDATE public.walle SET rates=2 WHERE id=method_id;
  retry:=public.create_deposit_request_atomic(v_userid,5,'usdt','txn_usdt_'||v_userid,'test_receipt_'||v_userid,'txn_destination_'||v_userid,1,deposit_id);
  IF retry->>'reused'<>'true' OR retry->>'notificationId'<>d->>'notificationId' THEN RAISE EXCEPTION 'Deposit retry was not idempotent'; END IF;
  SELECT count(*) INTO c FROM public.notification WHERE username=owner AND type='deposit';
  IF c<>1 THEN RAISE EXCEPTION 'Duplicate deposit requests'; END IF;
  BEGIN
    PERFORM public.create_deposit_request_atomic(v_userid,6,'usdt','txn_usdt_'||v_userid,'test_receipt_'||v_userid,'txn_destination_'||v_userid,1,deposit_id);
    RAISE EXCEPTION 'Reused deposit id accepted changed details' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Request id was already used%' THEN RAISE; END IF; END;
  BEGIN
    PERFORM public.submit_withdrawal_atomic(v_userid,50000,'1234','wallet','usdt');
    RAISE EXCEPTION 'Pending deposit did not block withdrawal' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'A pending payment request already exists' THEN RAISE; END IF; END;
  UPDATE public.notification SET sent='success',processed_action='approve',created_at=timezone('UTC',now())-interval '1 minute'
    WHERE id=(d->>'notificationId')::bigint;
  IF NOT EXISTS(SELECT 1 FROM public.notification_jobs WHERE event_key='finance:'||(d->>'notificationId')) THEN RAISE EXCEPTION 'Finance event was not queued'; END IF;
  UPDATE public.walle SET rates=1 WHERE id=method_id;
  INSERT INTO public.user_wallets(uid,walletnames,wallet,method,bank,names)
    SELECT public.users.uid,'txn_usdt_'||v_userid,'txn_wallet_'||v_userid,'crypto','testbank','' FROM public.users WHERE userid=v_userid
    RETURNING id INTO wallet_id;
  INSERT INTO public.placed(username,match_id,stake,aim,won,created_at)
    SELECT owner,'txn_match',5000,0,'true',timezone('UTC',now()) FROM generate_series(1,5);
  BEGIN
    PERFORM public.submit_withdrawal_atomic(v_userid,50000,'1234','txn_wallet_'||v_userid,'usdt');
    RAISE EXCEPTION 'Five bets satisfied six-bet rule' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Six bets are required%' THEN RAISE; END IF; END;
  INSERT INTO public.placed(username,match_id,stake,aim,won) VALUES(owner,'txn_match',5000,0,'true');
  BEGIN
    PERFORM public.submit_withdrawal_atomic(v_userid,50000,'0000','txn_wallet_'||v_userid,'usdt');
    RAISE EXCEPTION 'Wrong PIN accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'Wrong password' THEN RAISE; END IF; END;
  BEGIN
    PERFORM public.submit_withdrawal_atomic(uid2,50000,'1234','txn_wallet_'||v_userid,'usdt');
    RAISE EXCEPTION 'Another user wallet accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Please select an available wallet%' THEN RAISE; END IF; END;
  result:=public.submit_withdrawal_atomic(v_userid,50000,'1234','txn_wallet_'||v_userid,'usdt',NULL,NULL,withdrawal_id,1,7);
  IF (result->>'balance')::numeric<>1946500 OR (result->>'fee')::numeric<>3500 THEN RAISE EXCEPTION 'Incorrect withdrawal debit or fee'; END IF;
  DELETE FROM public.user_wallets WHERE id=wallet_id;
  retry:=public.submit_withdrawal_atomic(v_userid,50000,'1234','txn_wallet_'||v_userid,'usdt',NULL,NULL,withdrawal_id,99,99);
  IF retry->>'reused'<>'true' OR retry->>'notificationId'<>result->>'notificationId' THEN RAISE EXCEPTION 'Withdrawal retry did not recover committed request'; END IF;
  SELECT balance INTO original_balance FROM public.users WHERE userid=v_userid;
  IF original_balance<>1946500 THEN RAISE EXCEPTION 'Withdrawal retry debited twice'; END IF;
  IF public.read_customer_profile(v_userid)->'profile' ? 'pin' OR public.read_customer_profile(v_userid)->'profile' ? 'password' THEN RAISE EXCEPTION 'Profile exposed secrets'; END IF;
  IF public.read_payment_state(v_userid)->'withdrawalEligibility'->>'code'<>'PAYMENT_REQUEST_PENDING' THEN RAISE EXCEPTION 'Payment state missed pending request'; END IF;
  IF jsonb_array_length(public.read_bet_history(uid2,10)->'settled')<>0 THEN RAISE EXCEPTION 'Bet history leaked other user records'; END IF;
  IF jsonb_array_length(public.read_transaction_history(uid2)->'rows')<>0 THEN RAISE EXCEPTION 'Transaction history leaked other user records'; END IF;
  IF jsonb_array_length(public.read_notification_sources(uid2)->'sources'->'transaction')<>0 THEN RAISE EXCEPTION 'Notifications leaked other user records'; END IF;
  UPDATE public.admin_settings SET withdrawal_fee_percent=40 WHERE id=1;
  PERFORM public.process_finance_request('reject',(result->>'notificationId')::bigint);
  SELECT balance INTO original_balance FROM public.users WHERE userid=v_userid;
  IF original_balance<>2000000 THEN RAISE EXCEPTION 'Withdrawal rejection did not refund its exact original debit'; END IF;
  PERFORM public.process_finance_request('reject',(result->>'notificationId')::bigint);
  IF (SELECT balance FROM public.users WHERE userid=v_userid)<>2000000 THEN RAISE EXCEPTION 'Repeated rejection refunded twice'; END IF;
  IF jsonb_array_length(public.read_admin_overview()->'charts')<>6 THEN RAISE EXCEPTION 'Missing admin aggregate chart buckets'; END IF;
  INSERT INTO storage.objects(bucket_id,name,owner_id) VALUES('trcreceipt','web/'||uid2||'/fixture.png',uid2);
  IF NOT EXISTS(SELECT 1 FROM public.notification_jobs WHERE event_key='receipt_cleanup:web/'||uid2||'/fixture.png'
    AND available_at>=now()+interval '47 hours') THEN RAISE EXCEPTION 'Upload did not durably schedule cleanup'; END IF;
  PERFORM public.create_deposit_request_atomic(uid2,5,'usdt','txn_usdt_'||v_userid,
    'https://example.supabase.co/storage/v1/object/public/trcreceipt/web/'||uid2||'/fixture.png','txn_destination_'||v_userid,1,gen_random_uuid());
  INSERT INTO storage.objects(bucket_id,name,owner_id,created_at)
    VALUES('trcreceipt','web/'||v_userid||'/expired.png',v_userid,now()-interval '2 days');
  BEGIN
    PERFORM public.create_deposit_request_atomic(v_userid,5,'usdt','txn_usdt_'||v_userid,
      'https://example.supabase.co/storage/v1/object/public/trcreceipt/web/'||v_userid||'/expired.png','txn_destination_'||v_userid,1,gen_random_uuid());
    RAISE EXCEPTION 'Expired receipt accepted' USING ERRCODE='XX000';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM NOT LIKE 'Receipt upload expired%' THEN RAISE; END IF; END;

  BEGIN
    PERFORM public.claim_notification_jobs('invalid-secret',1);
    RAISE EXCEPTION 'Worker accepted invalid credential' USING ERRCODE='XX000';
  EXCEPTION WHEN invalid_authorization_specification THEN NULL; END;
  SELECT * INTO row FROM public.claim_notification_jobs(repeat('a',64),1) LIMIT 1;
  IF row.lease_token IS NULL THEN RAISE EXCEPTION 'Worker did not lease job'; END IF;
  IF public.finish_notification_job(row.id,gen_random_uuid(),NULL) THEN RAISE EXCEPTION 'Wrong worker lease completed job'; END IF;
  IF NOT public.finish_notification_job(row.id,row.lease_token,'transient failure') THEN RAISE EXCEPTION 'Worker retry failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.notification_jobs WHERE id=row.id AND state='queued' AND available_at>now()) THEN RAISE EXCEPTION 'No durable retry backoff'; END IF;
  FOR c IN SELECT 1 FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN
    ('submit_withdrawal_atomic','create_deposit_request_atomic','read_customer_profile','claim_notification_jobs')
    AND (has_function_privilege('anon',oid,'execute') OR has_function_privilege('authenticated',oid,'execute')) LOOP
    RAISE EXCEPTION 'Privileged RPC exposed to client role';
  END LOOP;
END; $$;
SELECT 'PASS: atomic signup, duplicate recovery, PIN/ownership checks, six-bet rule, debit integrity, private reads, durable notification retries, server-only RPC access' AS result;
ROLLBACK;
