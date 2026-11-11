-- Limits are expressed in each user's account currency. Null retains the existing policy.
ALTER TABLE public.admin_settings ADD COLUMN IF NOT EXISTS withdrawal_currency_limits jsonb;

CREATE OR REPLACE FUNCTION private.withdrawal_limits_in_mmk(code text, s public.admin_settings)
RETURNS jsonb LANGUAGE plpgsql STABLE SET search_path='' AS $$
DECLARE rate numeric; item jsonb; result jsonb; field text; value numeric;
BEGIN
  rate := CASE code WHEN 'MMK' THEN 5000 WHEN 'USDT' THEN 1 WHEN 'FCFA' THEN 600 WHEN 'ZMW' THEN 20 ELSE NULL END;
  IF rate IS NULL THEN RAISE EXCEPTION 'Invalid account currency'; END IF;
  IF s.withdrawal_currency_limits IS NULL THEN
    RETURN jsonb_build_object('minimum',s.min_withdrawal_amount,'perRequest',500000,'daily',s.daily_withdrawal_limit,'annual',s.max_withdrawal_amount);
  END IF;
  item:=s.withdrawal_currency_limits->code;
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
END; $$;
REVOKE ALL ON FUNCTION private.withdrawal_limits_in_mmk(text,public.admin_settings) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION private.withdrawal_limits_in_mmk(text,public.admin_settings) TO service_role;

CREATE OR REPLACE FUNCTION public.create_verified_withdrawal_request_atomic(p_userid text, p_amount numeric, p_payout_amount numeric, p_wallet_id bigint, p_method_id bigint, p_pin_hash text, p_wallet_snapshot jsonb, p_method_currency text, p_method_rate numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_user public.users%ROWTYPE; v_wallet public.user_wallets%ROWTYPE; v_method public.walle%ROWTYPE;
  v_quote jsonb; v_rate numeric; v_deposit_at timestamp; v_count integer; v_result jsonb;
BEGIN
  SELECT * INTO v_user FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF NOT coalesce(v_user.codeset,false) OR v_user.pin IS DISTINCT FROM p_pin_hash OR p_pin_hash IS NULL THEN RAISE EXCEPTION 'Transaction PIN changed'; END IF;
  SELECT * INTO v_wallet FROM public.user_wallets WHERE id=p_wallet_id
    AND uid=coalesce(nullif(trim(v_user.uid),''),v_user.userid) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payout wallet not found'; END IF;
  IF v_wallet.wallet IS DISTINCT FROM (p_wallet_snapshot->>'wallet')
      OR coalesce(v_wallet.bank,'') IS DISTINCT FROM coalesce(p_wallet_snapshot->>'bank','')
      OR coalesce(v_wallet.names,'') IS DISTINCT FROM coalesce(p_wallet_snapshot->>'names','') THEN
    RAISE EXCEPTION 'Payout wallet changed';
  END IF;
  SELECT * INTO v_method FROM public.walle WHERE id=p_method_id AND available=true
    AND lower(trim(name))=lower(trim(v_wallet.walletnames)) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal method is unavailable'; END IF;
  v_rate := CASE WHEN coalesce(v_method.rates,0)>0 THEN v_method.rates WHEN p_method_currency='USDT' THEN 1 ELSE 0 END;
  IF v_rate<=0 OR v_rate IS DISTINCT FROM p_method_rate THEN RAISE EXCEPTION 'Payment method rate changed'; END IF;
  v_quote := public.quote_withdrawal_amounts(p_payout_amount);
  IF (v_quote->>'total')::numeric IS DISTINCT FROM p_amount THEN RAISE EXCEPTION 'Withdrawal fee changed'; END IF;
  IF EXISTS(SELECT 1 FROM public.notification WHERE username=v_user.username
      AND lower(coalesce(type,'')) IN ('deposit','withdraw','withdrawer')
      AND lower(coalesce(sent,'pending')) IN ('pending','processing')) THEN
    RAISE EXCEPTION 'A pending payment request already exists';
  END IF;
  SELECT created_at INTO v_deposit_at FROM public.notification WHERE username=v_user.username
    AND type='deposit' AND lower(coalesce(sent,'')) IN ('success','true','completed') ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT count(*)::integer INTO v_count FROM public.placed WHERE username=v_user.username AND created_at>=v_deposit_at;
    IF v_count<6 THEN RAISE EXCEPTION 'Six bets are required after the latest successful deposit'; END IF;
  END IF;
  v_result := public.create_withdrawal_request_with_rate_snapshot_atomic(
    p_userid,p_amount,p_payout_amount,v_wallet.wallet,
    lower(trim(coalesce(nullif(v_method.currency_code,''),v_method.name))),v_wallet.bank,v_wallet.names,p_method_currency,v_rate);
  RETURN v_result;
END; $function$
;

CREATE OR REPLACE FUNCTION public.create_withdrawal_request_with_rate_snapshot_atomic(p_userid text, p_amount numeric, p_payout_amount numeric, p_wallet text, p_method text, p_bank text, p_accountname text, p_method_currency text, p_method_rate numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  user_row users%ROWTYPE;
  settings_row admin_settings%ROWTYPE;
  inserted_id BIGINT;
  next_balance NUMERIC;
  limits JSONB;
  daily_total NUMERIC;
  annual_total NUMERIC;
  is_limit_exempt BOOLEAN;
  utc_day_start TIMESTAMP;
  utc_year_start TIMESTAMP;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 OR p_payout_amount IS NULL OR p_payout_amount <= 0 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  IF p_method_currency IS NULL OR btrim(p_method_currency) = '' OR p_method_rate IS NULL OR p_method_rate <= 0 THEN
    RAISE EXCEPTION 'Invalid payment method rate';
  END IF;

  SELECT * INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  SELECT * INTO settings_row FROM admin_settings WHERE id = 1 FOR SHARE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal settings are not configured';
  END IF;

  IF NOT COALESCE(settings_row.withdrawals_enabled, TRUE) THEN
    RAISE EXCEPTION '%', COALESCE(NULLIF(btrim(settings_row.withdrawal_disabled_message), ''), 'Withdrawals are temporarily unavailable. Please try again later.');
  END IF;

  limits := private.withdrawal_limits_in_mmk(user_row.currency_code, settings_row);
  IF p_payout_amount < (limits->>'minimum')::numeric THEN
    RAISE EXCEPTION 'Minimum amount to withdraw is % MMK',(limits->>'minimum')::numeric;
  END IF;
  IF p_payout_amount > (limits->>'perRequest')::numeric THEN
    RAISE EXCEPTION 'Maximum amount to withdraw is % MMK',(limits->>'perRequest')::numeric;
  END IF;
  is_limit_exempt := EXISTS (
    SELECT 1
    FROM unnest(COALESCE(settings_row.withdrawal_limit_exempt_usernames, ARRAY[]::TEXT[])) AS exempt_username
    WHERE lower(btrim(exempt_username)) = lower(btrim(user_row.username))
  );

  IF NOT is_limit_exempt THEN
    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, 'pending')) IN ('pending', 'processing')
    ) THEN
      RAISE EXCEPTION 'A pending withdrawal request already exists';
    END IF;

    IF EXISTS (
      SELECT 1 FROM notification
      WHERE username = user_row.username
        AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
        AND lower(COALESCE(sent, '')) IN ('success', 'true', 'completed')
        AND COALESCE(processed_at, created_at) >= (timezone('UTC', now()) - INTERVAL '24 hours')
    ) THEN
      RAISE EXCEPTION 'A successful withdrawal was completed within the last 24 hours';
    END IF;

    utc_day_start := date_trunc('day', timezone('UTC', now()));
    utc_year_start := date_trunc('year', timezone('UTC', now()));

    SELECT COALESCE(SUM(amount), 0) INTO daily_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_day_start;

    IF daily_total + p_payout_amount > (limits->>'daily')::numeric THEN
      RAISE EXCEPTION 'Daily withdrawal limit of % MMK reached', (limits->>'daily')::numeric;
    END IF;

    SELECT COALESCE(SUM(amount), 0) INTO annual_total
    FROM notification
    WHERE username = user_row.username
      AND lower(COALESCE(type, '')) IN ('withdraw', 'withdrawer')
      AND lower(COALESCE(sent::TEXT, 'pending')) NOT IN ('failed', 'false', 'rejected')
      AND created_at >= utc_year_start;

    IF annual_total + p_payout_amount > (limits->>'annual')::numeric THEN
      RAISE EXCEPTION 'Annual withdrawal limit of % MMK reached', (limits->>'annual')::numeric;
    END IF;
  END IF;

  IF COALESCE(user_row.balance, 0) < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  INSERT INTO notification (
    address,
    username,
    amount,
    sent,
    type,
    method,
    method_currency,
    method_rate,
    bank,
    accountname
  )
  VALUES (
    p_wallet,
    user_row.username,
    round(p_payout_amount::NUMERIC, 3),
    'pending',
    'withdraw',
    p_method,
    p_method_currency,
    p_method_rate,
    p_bank,
    p_accountname
  )
  RETURNING id INTO inserted_id;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_amount
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  RETURN jsonb_build_object(
    'status', 'success',
    'notificationId', inserted_id,
    'balance', next_balance
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.read_payment_state(p_userid text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE u public.users%ROWTYPE; s public.admin_settings%ROWTYPE; pending jsonb; last_success timestamp;
  eligibility jsonb:=jsonb_build_object('canWithdraw',true,'reason',NULL,'code',NULL,'retryAt',NULL);
BEGIN
  SELECT * INTO u FROM public.users WHERE userid=p_userid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT * INTO s FROM public.admin_settings WHERE id=1;
  SELECT jsonb_build_object('id',id,'type',type,'sent',sent) INTO pending FROM public.notification WHERE username=u.username
    AND lower(coalesce(type,'')) IN ('deposit','withdraw','withdrawer')
    AND lower(coalesce(sent,'pending')) IN ('pending','processing') ORDER BY id DESC LIMIT 1;
  IF pending IS NOT NULL THEN
    eligibility:=jsonb_build_object('canWithdraw',false,'reason','pending','code','PAYMENT_REQUEST_PENDING','pendingType',pending->>'type','retryAt',NULL);
  ELSIF NOT EXISTS(SELECT 1 FROM unnest(coalesce(s.withdrawal_limit_exempt_usernames,ARRAY[]::text[])) e WHERE lower(trim(e))=lower(trim(u.username))) THEN
    SELECT max(coalesce(processed_at,created_at)) INTO last_success FROM public.notification WHERE username=u.username
      AND lower(coalesce(type,'')) IN ('withdraw','withdrawer') AND lower(coalesce(sent,'')) IN ('success','true','completed')
      AND coalesce(processed_at,created_at)>=timezone('UTC',now())-interval '24 hours';
    IF last_success IS NOT NULL THEN eligibility:=jsonb_build_object('canWithdraw',false,'reason','cooldown','code','WITHDRAWAL_COOLDOWN',
      'retryAt',(last_success+interval '24 hours') AT TIME ZONE 'UTC'); END IF;
  END IF;
  RETURN jsonb_build_object('profile',jsonb_build_object('userid',u.userid,'uid',u.uid,'username',u.username,'balance',u.balance,'currency_code',u.currency_code),
    'wallets',coalesce((SELECT jsonb_agg(to_jsonb(w)) FROM public.user_wallets w WHERE uid=coalesce(nullif(trim(u.uid),''),u.userid)),'[]'::jsonb),
    'methods',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.walle m WHERE available=true),'[]'::jsonb),
    'destinations',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.depositwallet d WHERE coalesce(available,true)),'[]'::jsonb),
    'settings',to_jsonb(s),'pendingPaymentRequest',pending,'withdrawalEligibility',eligibility);
END; $function$
;

CREATE OR REPLACE FUNCTION public.submit_withdrawal_atomic(p_userid text, p_amount numeric, p_pin text, p_wallet text, p_method text DEFAULT 'usdt'::text, p_bank text DEFAULT NULL::text, p_accountname text DEFAULT NULL::text, p_request_id uuid DEFAULT NULL::uuid, p_expected_rate numeric DEFAULT NULL::numeric, p_expected_fee_percent numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE u public.users%ROWTYPE; w public.user_wallets%ROWTYPE; m public.walle%ROWTYPE;
  s public.admin_settings%ROWTYPE; attempt public.transaction_attempts%ROWTYPE;
  fingerprint jsonb; result jsonb; q jsonb; deposit_at timestamp; placed_count integer; rate numeric; code text; destinations integer;
BEGIN
  IF p_amount IS NULL OR p_amount<=0 OR p_amount::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  SELECT * INTO u FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF NOT coalesce(u.codeset,false) THEN RAISE EXCEPTION 'No transaction pin has been set'; END IF;
  IF p_pin IS NULL OR p_pin !~ '^[0-9]{4}$' OR u.pin IS DISTINCT FROM p_pin THEN RAISE EXCEPTION 'Wrong password'; END IF;
  fingerprint:=jsonb_build_object('amount',round(p_amount,3),'wallet',trim(p_wallet),'method',lower(trim(p_method)),
    'bank',coalesce(p_bank,''),'accountname',coalesce(p_accountname,''));
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO attempt FROM public.transaction_attempts WHERE userid=p_userid AND request_id=p_request_id AND operation='withdraw';
    IF FOUND THEN
      IF attempt.fingerprint<>fingerprint THEN RAISE EXCEPTION 'Request id was already used for different details'; END IF;
      RETURN attempt.result||jsonb_build_object('reused',true);
    END IF;
  END IF;
  SELECT * INTO s FROM public.admin_settings WHERE id=1 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal settings are not configured'; END IF;
  IF NOT s.withdrawals_enabled THEN RAISE EXCEPTION '%',s.withdrawal_disabled_message; END IF;
  IF EXISTS(SELECT 1 FROM public.notification WHERE username=u.username
    AND lower(coalesce(type,'')) IN ('deposit','withdraw','withdrawer')
    AND lower(coalesce(sent,'pending')) IN ('pending','processing')) THEN RAISE EXCEPTION 'A pending payment request already exists'; END IF;
  SELECT count(*) INTO destinations FROM public.user_wallets a JOIN public.walle b ON lower(trim(b.name))=lower(trim(a.walletnames))
    WHERE a.uid=coalesce(nullif(trim(u.uid),''),u.userid) AND a.wallet=trim(p_wallet) AND b.available=true
      AND lower(trim(p_method)) IN (lower(trim(b.name)),lower(trim(b.currency_code)))
      AND (nullif(trim(p_bank),'') IS NULL OR trim(p_bank)=coalesce(a.bank,''))
      AND (nullif(trim(p_accountname),'') IS NULL OR trim(p_accountname)=coalesce(a.names,''));
  IF destinations<>1 THEN RAISE EXCEPTION 'Please select an available wallet linked to your account'; END IF;
  SELECT a.* INTO w FROM public.user_wallets a JOIN public.walle b ON lower(trim(b.name))=lower(trim(a.walletnames))
    WHERE a.uid=coalesce(nullif(trim(u.uid),''),u.userid) AND a.wallet=trim(p_wallet) AND b.available=true
      AND lower(trim(p_method)) IN (lower(trim(b.name)),lower(trim(b.currency_code)))
      AND (nullif(trim(p_bank),'') IS NULL OR trim(p_bank)=coalesce(a.bank,''))
      AND (nullif(trim(p_accountname),'') IS NULL OR trim(p_accountname)=coalesce(a.names,'')) FOR SHARE OF a;
  SELECT * INTO m FROM public.walle WHERE lower(trim(name))=lower(trim(w.walletnames)) AND available=true FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Withdrawal method is unavailable'; END IF;
  code:=lower(trim(coalesce(nullif(m.currency_code,''),m.name)));
  rate:=CASE WHEN coalesce(m.rates,0)>0 THEN m.rates WHEN code IN ('usdt','usd','tether') OR code ~ '(^|[ ()_-])(usdt|tether)($|[ ()_-])' THEN 1 ELSE 0 END;
  IF rate<=0 THEN RAISE EXCEPTION 'Withdrawal method rate is unavailable'; END IF;
  IF p_expected_rate IS NOT NULL AND p_expected_rate IS DISTINCT FROM rate THEN RAISE EXCEPTION 'Payment method rate changed'; END IF;
  IF p_expected_fee_percent IS NOT NULL AND p_expected_fee_percent IS DISTINCT FROM s.withdrawal_fee_percent THEN RAISE EXCEPTION 'Withdrawal fee changed'; END IF;
  SELECT created_at INTO deposit_at FROM public.notification WHERE username=u.username AND type='deposit'
    AND lower(coalesce(sent,'')) IN ('success','true','completed') ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT count(*) INTO placed_count FROM (SELECT 1 FROM public.placed WHERE username=u.username AND created_at>=deposit_at LIMIT 6) eligible;
    IF placed_count<6 THEN RAISE EXCEPTION 'Six bets are required after the latest successful deposit. You have placed %',placed_count; END IF;
  END IF;
  q:=public.quote_withdrawal_amounts(p_amount);
  result:=public.create_withdrawal_request_with_rate_snapshot_atomic(p_userid,(q->>'total')::numeric,(q->>'amount')::numeric,
    w.wallet,code,w.bank,w.names,
    CASE WHEN code IN ('usdt','usd','tether') OR code ~ '(^|[ ()_-])(usdt|tether)($|[ ()_-])' THEN 'USDT' ELSE upper(code) END,rate);
  UPDATE public.notification SET reserved_amount=(q->>'total')::numeric WHERE id=(result->>'notificationId')::bigint;
  result:=result||jsonb_build_object('amount',(q->>'amount')::numeric,'fee',(q->>'fee')::numeric,'total',(q->>'total')::numeric);
  IF p_request_id IS NOT NULL THEN
    INSERT INTO public.transaction_attempts(userid,request_id,operation,fingerprint,result) VALUES(p_userid,p_request_id,'withdraw',fingerprint,result);
  END IF;
  RETURN result;
END; $function$
;


