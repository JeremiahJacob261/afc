-- Transaction APIs verify Auth before calling these service-role-only functions.
-- New operations are additive so an application rollback can use the old APIs.
CREATE SCHEMA IF NOT EXISTS private;
ALTER TABLE public.notification ADD COLUMN reserved_amount numeric;
COMMENT ON COLUMN public.notification.reserved_amount IS 'Exact ledger debit reserved by a withdrawal, including its fee; used for an exact refund.';
CREATE OR REPLACE FUNCTION public.process_finance_action_atomic(p_action text, p_id bigint DEFAULT NULL::bigint, p_uid text DEFAULT NULL::text, p_approved_amount numeric DEFAULT NULL::numeric, p_first_deposit_bonus_percent numeric DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  notification_row notification%ROWTYPE;
  user_row users%ROWTYPE;
  current_sent TEXT;
  normalized_type TEXT;
  final_sent TEXT;
  deposit_amount NUMERIC;
  withdraw_amount NUMERIC;
  refund_amount NUMERIC;
  notification_amount NUMERIC;
  first_deposit_bonus NUMERIC;
  referral_bonus NUMERIC;
  bonus_percent NUMERIC;
BEGIN
  p_action := lower(btrim(COALESCE(p_action, '')));

  IF p_action NOT IN ('approve', 'reject') THEN
    RAISE EXCEPTION 'Invalid finance action';
  END IF;

  IF p_id IS NULL AND (p_uid IS NULL OR btrim(p_uid) = '') THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF p_id IS NOT NULL THEN
    SELECT * INTO notification_row FROM notification WHERE id = p_id FOR UPDATE;
  ELSE
    SELECT * INTO notification_row FROM notification WHERE uid::TEXT = p_uid FOR UPDATE;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  current_sent := lower(COALESCE(notification_row.sent, 'pending'));
  normalized_type := lower(COALESCE(notification_row.type, ''));

  BEGIN
    notification_amount := NULLIF(notification_row.amount::TEXT, '')::NUMERIC;
  EXCEPTION WHEN invalid_text_representation THEN
    RAISE EXCEPTION 'Invalid transaction amount';
  END;

  IF current_sent IN ('success', 'true', 'completed') THEN
    IF p_action = 'approve' THEN
      RETURN jsonb_build_object('status', 'success', 'sent', 'success', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent IN ('failed', 'false') THEN
    IF p_action = 'reject' THEN
      RETURN jsonb_build_object('status', 'success', 'sent', 'failed', 'alreadyProcessed', TRUE, 'transactionId', notification_row.id);
    END IF;
    RAISE EXCEPTION 'Transaction already processed with a different action';
  END IF;

  IF current_sent = 'processing' THEN
    RAISE EXCEPTION 'Transaction already being processed';
  END IF;

  IF normalized_type NOT IN ('deposit', 'withdraw', 'withdrawer') THEN
    RAISE EXCEPTION 'Unsupported transaction type';
  END IF;

  SELECT * INTO user_row FROM users WHERE username = notification_row.username FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  UPDATE notification
  SET processing_started_at = COALESCE(processing_started_at, now())
  WHERE id = notification_row.id;

  IF p_action = 'reject' THEN
    IF normalized_type IN ('withdraw', 'withdrawer') THEN
      refund_amount := COALESCE(notification_row.reserved_amount, round((COALESCE(notification_amount, 0) / 0.95)::NUMERIC, 3));
      IF refund_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid transaction amount';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + refund_amount
      WHERE username = notification_row.username;
    END IF;

    final_sent := 'failed';
  ELSE
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 THEN
      RAISE EXCEPTION 'Invalid transaction amount';
    END IF;

    IF normalized_type = 'deposit' THEN
      deposit_amount := round(p_approved_amount::NUMERIC, 3);
      bonus_percent := COALESCE(p_first_deposit_bonus_percent, 3);

      IF bonus_percent < 0 OR bonus_percent > 100 THEN
        RAISE EXCEPTION 'First deposit bonus percent must be between 0 and 100';
      END IF;

      UPDATE users
      SET balance = COALESCE(balance, 0) + deposit_amount,
          totald = COALESCE(totald, 0) + deposit_amount,
          deposit = COALESCE(deposit, 0) + 1
      WHERE username = notification_row.username;

      UPDATE reading
      SET deposit = COALESCE(deposit, 0) + deposit_amount
      WHERE id = 1;

      IF COALESCE(user_row.firstd, FALSE) IS FALSE THEN
        first_deposit_bonus := round(((deposit_amount * bonus_percent) / 100)::NUMERIC, 3);

        IF first_deposit_bonus > 0 THEN
          UPDATE users
          SET balance = COALESCE(balance, 0) + first_deposit_bonus
          WHERE username = notification_row.username;

          INSERT INTO activa (code, username, type, amount)
          VALUES ('firstdepositbonus', notification_row.username, 'depbonus', first_deposit_bonus);
        END IF;

        referral_bonus := round((deposit_amount * 0.05)::NUMERIC, 3);

        UPDATE users
        SET balance = COALESCE(balance, 0) + referral_bonus
        WHERE newrefer = user_row.refer;

        INSERT INTO activa (username, type, amount, code)
        VALUES (notification_row.username, 'depbonus', referral_bonus, user_row.refer);

        UPDATE users
        SET firstd = TRUE
        WHERE username = notification_row.username;
      END IF;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'deposit', deposit_amount);
    ELSE
      withdraw_amount := round(p_approved_amount::NUMERIC, 3);

      UPDATE users
      SET totalw = COALESCE(totalw, 0) + withdraw_amount
      WHERE username = notification_row.username;

      UPDATE reading
      SET withdraw = COALESCE(withdraw, 0) + withdraw_amount
      WHERE id = 1;

      INSERT INTO activa (code, username, type, amount)
      VALUES ('finance', notification_row.username, 'withdraw', COALESCE(notification_amount, 0));
    END IF;

    final_sent := 'success';
  END IF;

  UPDATE notification
  SET sent = final_sent,
      processed_action = p_action,
      processed_at = now()
  WHERE id = notification_row.id;

  RETURN jsonb_build_object('status', 'success', 'sent', final_sent, 'alreadyProcessed', FALSE, 'transactionId', notification_row.id);
END;
$function$;
CREATE TABLE public.transaction_attempts (
  userid text NOT NULL REFERENCES public.users(userid) ON DELETE CASCADE,
  request_id uuid NOT NULL,
  operation text NOT NULL CHECK (operation IN ('deposit','withdraw')),
  fingerprint jsonb NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (userid, request_id, operation)
);
ALTER TABLE public.transaction_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.transaction_attempts FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.transaction_attempts TO service_role;

CREATE TABLE public.notification_jobs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_key text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('team','finance','settlement','company_match','wheel_push','receipt_cleanup')),
  payload jsonb NOT NULL,
  state text NOT NULL DEFAULT 'queued' CHECK (state IN ('queued','running','done','dead')),
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  lease_token uuid,
  leased_until timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX notification_jobs_ready ON public.notification_jobs(available_at,id) WHERE state IN ('queued','running');
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_jobs FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.notification_jobs TO service_role;
GRANT USAGE,SELECT ON SEQUENCE public.notification_jobs_id_seq TO service_role;
CREATE TABLE private.notification_worker_credentials (
  id boolean PRIMARY KEY DEFAULT true CHECK (id), token_hash bytea NOT NULL
);
REVOKE ALL ON private.notification_worker_credentials FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT ON private.notification_worker_credentials TO service_role;

CREATE FUNCTION public.claim_notification_jobs(p_secret text,p_limit integer DEFAULT 10)
RETURNS SETOF public.notification_jobs LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF p_secret IS NULL OR NOT EXISTS (SELECT 1 FROM private.notification_worker_credentials
    WHERE token_hash=extensions.digest(p_secret,'sha256')) THEN
    RAISE EXCEPTION 'Worker authorization required' USING ERRCODE='28000';
  END IF;
  UPDATE public.notification_jobs SET state='dead',last_error=coalesce(last_error,'Worker lease expired after maximum attempts')
    WHERE attempts>=8 AND (state='queued' OR state='running' AND leased_until<now());
  RETURN QUERY WITH ready AS (
    SELECT id FROM public.notification_jobs WHERE attempts<8 AND available_at<=now()
      AND (state='queued' OR (state='running' AND leased_until<now()))
      ORDER BY available_at,id LIMIT greatest(1,least(p_limit,10)) FOR UPDATE SKIP LOCKED
  ) UPDATE public.notification_jobs j SET state='running',attempts=j.attempts+1,
    lease_token=gen_random_uuid(),leased_until=now()+interval '2 minutes'
    FROM ready WHERE j.id=ready.id RETURNING j.*;
END; $$;

-- Shared match locks allow unrelated users to place bets concurrently. Match
-- settlement takes an exclusive lock; acquire match before user in both paths.
CREATE OR REPLACE FUNCTION public.place_bet_atomic(p_userid text, p_match_id text, p_picked text, p_stake numeric, p_client_bet_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
  user_row users%ROWTYPE;
  match_row bets%ROWTYPE;
  market_key TEXT;
  market_label TEXT;
  base_odd NUMERIC;
  final_odd NUMERIC;
  profit_amount NUMERIC;
  next_balance NUMERIC;
  referral_count INTEGER;
  vip_level INTEGER;
  start_ms NUMERIC;
  now_ms NUMERIC;
  inserted_betid TEXT;
BEGIN
  IF p_userid IS NULL OR btrim(p_userid) = '' THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_match_id IS NULL OR btrim(p_match_id) = '' THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  IF p_stake IS NULL OR p_stake < 2500 THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  market_key := public.score_market_key(p_picked);
  market_label := public.score_market_label(p_picked);
  IF market_key IS NULL OR market_label IS NULL THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;

  SELECT *
  INTO match_row
  FROM bets
  WHERE match_id = p_match_id
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found';
  END IF;

  SELECT *
  INTO user_row
  FROM users
  WHERE userid = p_userid
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF COALESCE(user_row.balance, 0) < p_stake THEN
    RAISE EXCEPTION 'You do not have enough MMK to complete this bet';
  END IF;

  IF COALESCE(user_row.gcount, 0) > 2 THEN
    RAISE EXCEPTION 'You have reached the maximum number of bets for today';
  END IF;



  IF COALESCE(match_row.verified, FALSE) THEN
    RAISE EXCEPTION 'Match already settled';
  END IF;

  start_ms := COALESCE(match_row.tsgmt, 0);
  IF start_ms > 0 AND start_ms < 1000000000000 THEN
    start_ms := start_ms * 1000;
  END IF;
  now_ms := EXTRACT(EPOCH FROM now()) * 1000;

  IF start_ms <= now_ms THEN
    RAISE EXCEPTION 'This Match has expired';
  END IF;

  base_odd := COALESCE(NULLIF(to_jsonb(match_row) ->> market_key, '')::NUMERIC, 0);
  IF base_odd <= 0 THEN
    RAISE EXCEPTION 'This market is not available';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO referral_count
  FROM users
  WHERE refer = user_row.newrefer
    AND balance >= (SELECT public.active_member_balance_threshold());

  vip_level := public.vip_level_for_user(user_row.totald, referral_count);
  final_odd := round(base_odd * (1 + public.vip_bonus_for_level(vip_level)), 3);
  profit_amount := round((final_odd * p_stake) / 100, 2);

  IF p_client_bet_id IS NULL THEN
    INSERT INTO placed (
      match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    RETURNING betid::TEXT INTO inserted_betid;
  ELSE
    INSERT INTO placed (
      betid, match_id, market, username, started, stake, profit, aim,
      home, away, time, date, odd, ihome, iaway,
      levelone, leveltwo, levelthree, aone, atwo, athree
    )
    VALUES (
      p_client_bet_id, match_row.match_id, market_label, user_row.username, FALSE, p_stake, profit_amount, profit_amount,
      match_row.home, match_row.away, match_row.time, match_row.date, final_odd, match_row.ihome, match_row.iaway,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN '7705966' ELSE user_row.refer END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN '7705966' ELSE user_row.lvla END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN '7705966' ELSE user_row.lvlb END,
      CASE WHEN length(COALESCE(user_row.refer, '')) < 2 THEN 0 ELSE 0.06 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvla, '')) < 2 THEN 0 ELSE 0.03 * profit_amount END,
      CASE WHEN length(COALESCE(user_row.lvlb, '')) < 2 THEN 0 ELSE 0.01 * profit_amount END
    )
    ON CONFLICT (betid) DO NOTHING
    RETURNING betid::TEXT INTO inserted_betid;

    IF inserted_betid IS NULL THEN
      SELECT betid::TEXT
      INTO inserted_betid
      FROM placed
      WHERE betid::TEXT = p_client_bet_id::TEXT
        AND username = user_row.username
        AND match_id = match_row.match_id;

      IF inserted_betid IS NULL THEN
        RAISE EXCEPTION 'Duplicate bet id';
      END IF;

      RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Bet Successful',
        'betid', inserted_betid,
        'balance', user_row.balance,
        'profit', profit_amount,
        'odd', final_odd,
        'reused', TRUE
      );
    END IF;
  END IF;

  UPDATE users
  SET balance = COALESCE(balance, 0) - p_stake,
      gcount = COALESCE(gcount, 0) + 1
  WHERE username = user_row.username
  RETURNING balance INTO next_balance;

  INSERT INTO useractivity (type, amount, "user", match_id, stake, profit, market)
  VALUES ('bets', p_stake + profit_amount, user_row.username, match_row.match_id, p_stake, profit_amount, market_label);

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Bet Successful',
    'betid', inserted_betid,
    'balance', next_balance,
    'profit', profit_amount,
    'odd', final_odd
  );
END;
$function$;


CREATE FUNCTION public.finish_notification_job(p_id bigint,p_lease_token uuid,p_error text DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  UPDATE public.notification_jobs SET state=CASE WHEN p_error IS NULL THEN 'done'
    WHEN attempts>=8 THEN 'dead' ELSE 'queued' END,
    completed_at=CASE WHEN p_error IS NULL THEN now() ELSE NULL END,
    available_at=now()+make_interval(secs=>least(3600,(power(2,attempts)*15)::integer)),
    last_error=left(p_error,500),leased_until=NULL,lease_token=NULL
    WHERE id=p_id AND lease_token=p_lease_token AND state='running';
  RETURN FOUND;
END; $$;

-- Storage owns the upload identity; bookkeeping commits with the object, even
-- if the upload response is lost. Only this bucket/prefix gets cleanup jobs.
CREATE FUNCTION private.queue_receipt_cleanup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.bucket_id<>'trcreceipt' OR NEW.name NOT LIKE 'web/%' THEN RETURN NEW; END IF;
  INSERT INTO public.notification_jobs(event_key,kind,payload,available_at)
    VALUES('receipt_cleanup:'||NEW.name,'receipt_cleanup',jsonb_build_object('path',NEW.name),now()+interval '48 hours')
    ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.queue_receipt_cleanup() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER queue_receipt_cleanup AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION private.queue_receipt_cleanup();

CREATE FUNCTION public.record_notification_job() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE k text; event text; payload jsonb;
BEGIN
  IF TG_TABLE_NAME='users' THEN
    k:='team'; event:='team:'||NEW.userid;
    payload:=jsonb_build_object('userid',NEW.userid,'username',NEW.username,'refer',NEW.refer,
      'lvla',NEW.lvla,'lvlb',NEW.lvlb,'newrefer',NEW.newrefer);
  ELSIF TG_TABLE_NAME='notification' THEN
    IF NEW.sent NOT IN ('success','failed') OR NEW.processed_action NOT IN ('approve','reject')
      OR OLD.sent IS NOT DISTINCT FROM NEW.sent THEN RETURN NEW; END IF;
    k:='finance'; event:='finance:'||NEW.id::text;
    payload:=jsonb_build_object('transaction',to_jsonb(NEW),'action',NEW.processed_action,
      'sent',NEW.sent,'amount',NEW.amount);
  ELSIF TG_TABLE_NAME='app_notifications' THEN
    IF NEW.event_type<>'wheel_reward' THEN RETURN NEW; END IF;
    k:='wheel_push'; event:='wheel_push:'||NEW.id::text;
    payload:=jsonb_build_object('id',NEW.id,'username',NEW.recipient_username,
      'title',NEW.title,'body',NEW.body,'data',NEW.data);
  ELSIF TG_TABLE_NAME='bets' AND TG_OP='INSERT' THEN
    IF NOT coalesce(NEW.company,false) THEN RETURN NEW; END IF;
    k:='company_match'; event:='company_match:'||NEW.match_id; payload:=to_jsonb(NEW);
  ELSE
    IF NOT coalesce(NEW.verified,false) OR coalesce(OLD.verified,false) THEN RETURN NEW; END IF;
    k:='settlement'; event:='settlement:'||NEW.match_id;
    payload:=jsonb_build_object('matchId',NEW.match_id,'company',coalesce(NEW.company,false),
      'protectedMarket',CASE WHEN coalesce(NEW.company,false) THEN
        public.score_market_label(NEW.comarket) ELSE NULL END);
  END IF;
  INSERT INTO public.notification_jobs(event_key,kind,payload) VALUES(event,k,payload)
    ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER queue_team_notification AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.record_notification_job();
CREATE TRIGGER queue_finance_notification AFTER UPDATE OF sent ON public.notification FOR EACH ROW EXECUTE FUNCTION public.record_notification_job();
CREATE TRIGGER queue_wheel_push AFTER INSERT ON public.app_notifications FOR EACH ROW EXECUTE FUNCTION public.record_notification_job();
CREATE TRIGGER queue_company_match AFTER INSERT ON public.bets FOR EACH ROW EXECUTE FUNCTION public.record_notification_job();
CREATE TRIGGER queue_settlement_notification AFTER UPDATE OF verified ON public.bets FOR EACH ROW EXECUTE FUNCTION public.record_notification_job();

-- Auth and the web profile commit together. NEW.id/email are supplied by Auth;
-- editable metadata supplies profile fields only, never authorization claims.
CREATE FUNCTION private.provision_web_auth_profile() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE metadata jsonb:=NEW.raw_user_meta_data; referral text;
BEGIN
  IF metadata->>'profile_version'<>'2' OR metadata->>'profile_version' IS NULL THEN RETURN NEW; END IF;
  referral:=nullif(trim(metadata->>'refer'),'');
  IF referral IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.users WHERE newrefer=referral) THEN referral:=NULL; END IF;
  PERFORM public.provision_native_profile_atomic(NEW.id::text,NEW.email,metadata->>'displayName',
    metadata->>'phoneNumber',metadata->>'countrycode',referral);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.provision_web_auth_profile() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER provision_web_auth_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION private.provision_web_auth_profile();

CREATE FUNCTION public.create_deposit_request_atomic(p_userid text,p_amount numeric,p_method text,
  p_method_name text,p_receipt text,p_destination text,p_expected_rate numeric DEFAULT NULL,p_request_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; m public.walle%ROWTYPE; prior public.notification%ROWTYPE;
  attempt public.transaction_attempts%ROWTYPE; fingerprint jsonb; rate numeric; code text; result jsonb; inserted_id bigint;
BEGIN
  IF p_amount IS NULL OR p_amount<=0 OR p_amount::text IN ('NaN','Infinity','-Infinity')
    OR nullif(trim(p_receipt),'') IS NULL OR nullif(trim(p_destination),'') IS NULL THEN
    RAISE EXCEPTION 'Invalid deposit details'; END IF;
  SELECT * INTO u FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  fingerprint:=jsonb_build_object('amount',p_amount,'method',lower(trim(p_method)),
    'methodName',lower(trim(p_method_name)),'receipt',p_receipt,'destination',p_destination);
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO attempt FROM public.transaction_attempts WHERE userid=p_userid AND request_id=p_request_id AND operation='deposit';
    IF FOUND THEN
      IF attempt.fingerprint<>fingerprint THEN RAISE EXCEPTION 'Request id was already used for different details'; END IF;
      RETURN attempt.result||jsonb_build_object('reused',true);
    END IF;
  END IF;
  SELECT * INTO prior FROM public.notification WHERE username=u.username AND type='deposit' AND address=p_receipt ORDER BY id LIMIT 1;
  IF FOUND THEN
    IF prior.amount<>p_amount OR lower(trim(prior.method))<>lower(trim(p_method))
      OR prior.adminaddress IS DISTINCT FROM p_destination THEN RAISE EXCEPTION 'This receipt was already used for another deposit'; END IF;
    RETURN jsonb_build_object('status','success','notificationId',prior.id,'reused',true);
  END IF;
  IF EXISTS(SELECT 1 FROM public.notification WHERE username=u.username
    AND lower(coalesce(type,'')) IN ('deposit','withdraw','withdrawer')
    AND lower(coalesce(sent,'pending')) IN ('pending','processing')) THEN
    RAISE EXCEPTION 'A pending payment request already exists'; END IF;
  IF p_receipt LIKE '%/storage/v1/object/public/trcreceipt/web/%' THEN
    IF split_part(p_receipt,'/trcreceipt/',2) NOT LIKE 'web/'||p_userid||'/%' THEN RAISE EXCEPTION 'Invalid receipt owner'; END IF;
    PERFORM 1 FROM storage.objects WHERE bucket_id='trcreceipt' AND name=split_part(p_receipt,'/trcreceipt/',2)
      AND created_at>now()-interval '24 hours' FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Receipt upload expired. Please upload it again'; END IF;
  END IF;
  SELECT * INTO m FROM public.walle WHERE available=true
    AND (lower(trim(name))=lower(trim(p_method_name)) OR lower(trim(currency_code))=lower(trim(p_method_name))) ORDER BY id LIMIT 1 FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown or unavailable deposit method'; END IF;
  code:=lower(trim(coalesce(nullif(m.currency_code,''),m.name)));
  IF lower(trim(p_method))<>code THEN RAISE EXCEPTION 'Payment method changed. Please refresh and try again'; END IF;
  rate:=CASE WHEN coalesce(m.rates,0)>0 THEN m.rates WHEN code IN ('usdt','usd','tether') OR code ~ '(^|[ ()_-])(usdt|tether)($|[ ()_-])' THEN 1 ELSE 0 END;
  IF rate<=0 OR p_amount/rate*5000<25000 THEN RAISE EXCEPTION 'Minimum deposit is 25,000 MMK equivalent'; END IF;
  IF p_expected_rate IS NOT NULL AND p_expected_rate IS DISTINCT FROM rate THEN RAISE EXCEPTION 'Payment rate changed. Review the amount and payment details again'; END IF;
  PERFORM 1 FROM public.depositwallet WHERE address=p_destination AND coalesce(available,true)
    AND (lower(trim(name))=lower(trim(m.name)) OR lower(trim(currency_code))=code) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment destination is no longer available'; END IF;
  INSERT INTO public.notification(username,amount,type,sent,method,method_currency,method_rate,address,adminaddress)
    VALUES(u.username,p_amount,'deposit','pending',code,
      CASE WHEN code IN ('usdt','usd','tether') OR code ~ '(^|[ ()_-])(usdt|tether)($|[ ()_-])' THEN 'USDT' ELSE upper(code) END,
      rate,p_receipt,p_destination) RETURNING id INTO inserted_id;
  result:=jsonb_build_object('status','success','notificationId',inserted_id);
  IF p_request_id IS NOT NULL THEN
    INSERT INTO public.transaction_attempts(userid,request_id,operation,fingerprint,result) VALUES(p_userid,p_request_id,'deposit',fingerprint,result);
  END IF;
  RETURN result;
END; $$;

CREATE FUNCTION public.submit_withdrawal_atomic(p_userid text,p_amount numeric,p_pin text,p_wallet text,
  p_method text DEFAULT 'usdt',p_bank text DEFAULT NULL,p_accountname text DEFAULT NULL,p_request_id uuid DEFAULT NULL,
  p_expected_rate numeric DEFAULT NULL,p_expected_fee_percent numeric DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
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
  IF round(p_amount,3)<s.min_withdrawal_amount THEN RAISE EXCEPTION 'Minimum amount to withdraw is % MMK',s.min_withdrawal_amount; END IF;
  IF round(p_amount,3)>500000 THEN RAISE EXCEPTION 'Maximum amount to withdraw is 500,000 MMK'; END IF;
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
END; $$;

CREATE FUNCTION public.bind_wallet_atomic(p_userid text,p_method_id bigint,p_method_name text,p_wallet text,p_bank text,p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; m public.walle%ROWTYPE; wallet_id bigint; local_method boolean;
BEGIN
  SELECT * INTO u FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  IF nullif(trim(p_wallet),'') IS NULL THEN RAISE EXCEPTION 'Missing wallet details'; END IF;
  SELECT * INTO m FROM public.walle WHERE available=true AND (CASE WHEN p_method_id IS NOT NULL
    THEN id=p_method_id ELSE name=p_method_name END) FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Payment method is not available'; END IF;
  local_method:=lower(trim(m.type)) IN ('local','local-transfer','bank','mobile-money');
  IF local_method AND (nullif(trim(p_bank),'') IS NULL OR nullif(trim(p_name),'') IS NULL) THEN RAISE EXCEPTION 'Missing bank account details'; END IF;
  INSERT INTO public.user_wallets(uid,walletnames,wallet,method,bank,names)
    VALUES(coalesce(nullif(trim(u.uid),''),u.userid),m.name,trim(p_wallet),m.type,
      CASE WHEN local_method THEN trim(p_bank) ELSE m.name END,CASE WHEN local_method THEN trim(p_name) ELSE '' END)
    ON CONFLICT(uid,walletnames) DO NOTHING RETURNING id INTO wallet_id;
  IF wallet_id IS NULL THEN RETURN jsonb_build_object('status','failed','message','Wallet already linked'); END IF;
  RETURN jsonb_build_object('status','success','message','Wallet Binding Success','walletId',wallet_id);
END; $$;

CREATE FUNCTION public.read_customer_profile(p_userid text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE profile jsonb; refcode text; threshold numeric; referrals bigint;
BEGIN
  SELECT to_jsonb(p),p.newrefer INTO profile,refcode FROM (SELECT userid,uid,username,email,phone,countrycode,
    balance,totald,totalw,newrefer,refer,lvla,lvlb,firstd,dailywl,codeset,gcount FROM public.users WHERE userid=p_userid) p;
  IF profile IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT coalesce(membership_balance_threshold,8335) INTO threshold FROM public.admin_settings WHERE id=1;
  threshold:=coalesce(threshold,8335);
  SELECT count(*) INTO referrals FROM public.users WHERE refer=refcode AND balance>=threshold;
  RETURN jsonb_build_object('profile',profile,'referralCount',referrals,'membershipBalanceThreshold',threshold);
END; $$;

CREATE FUNCTION public.read_payment_state(p_userid text) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
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
  RETURN jsonb_build_object('profile',jsonb_build_object('userid',u.userid,'uid',u.uid,'username',u.username,'balance',u.balance),
    'wallets',coalesce((SELECT jsonb_agg(to_jsonb(w)) FROM public.user_wallets w WHERE uid=coalesce(nullif(trim(u.uid),''),u.userid)),'[]'::jsonb),
    'methods',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.walle m WHERE available=true),'[]'::jsonb),
    'destinations',coalesce((SELECT jsonb_agg(to_jsonb(d)) FROM public.depositwallet d WHERE coalesce(available,true)),'[]'::jsonb),
    'settings',to_jsonb(s),'pendingPaymentRequest',pending,'withdrawalEligibility',eligibility);
END; $$;

-- Composite indexes match ownership filters and keyset pagination, rather than
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
  IF p_payout_amount < (SELECT min_withdrawal_amount FROM public.admin_settings WHERE id=1) THEN RAISE EXCEPTION 'Minimum withdrawal amount changed'; END IF;
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
END; $function$;

-- Composite indexes match ownership filters and keyset pagination, rather than
CREATE OR REPLACE FUNCTION public.place_native_bet_atomic(p_userid text, p_match_id text, p_picked text, p_stake numeric, p_expected_odd numeric, p_client_bet_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  v_user public.users%ROWTYPE; v_existing public.placed%ROWTYPE; v_market text; v_result jsonb;
BEGIN
  v_market := public.score_market_label(p_picked);
  IF p_client_bet_id IS NULL OR v_market IS NULL OR p_stake IS NULL OR p_stake<2500
      OR p_stake::text IN ('NaN','Infinity','-Infinity') OR p_expected_odd IS NULL
      OR p_expected_odd<=0 OR p_expected_odd::text IN ('NaN','Infinity','-Infinity') THEN
    RAISE EXCEPTION 'Invalid bet details';
  END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_client_bet_id::text,8417));
  -- Match first, as in settlement. A replay still succeeds after settlement.
  PERFORM 1 FROM public.bets WHERE match_id=p_match_id FOR SHARE;
  SELECT * INTO v_user FROM public.users WHERE userid=p_userid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT * INTO v_existing FROM public.placed WHERE betid=p_client_bet_id::text;
  IF FOUND THEN
    IF v_existing.username IS DISTINCT FROM v_user.username OR v_existing.match_id IS DISTINCT FROM p_match_id
        OR v_existing.market IS DISTINCT FROM v_market OR v_existing.stake IS DISTINCT FROM p_stake
        OR round(v_existing.odd,3) IS DISTINCT FROM round(p_expected_odd,3) THEN
      RAISE EXCEPTION 'Duplicate bet id';
    END IF;
    RETURN jsonb_build_object('status','success','message','Bet Successful','betid',v_existing.betid,
      'balance',v_user.balance,'profit',v_existing.profit,'odd',v_existing.odd,'reused',true);
  END IF;
  -- The legacy calculation runs only for a new attempt, under the same transaction/user lock.
  -- It retains existing pricing, eligibility, debit, activity and referral rules.
  v_result := public.place_bet_with_expected_odd_atomic(p_userid,p_match_id,p_picked,p_stake,p_expected_odd,p_client_bet_id);
  RETURN v_result;
END; $function$;


-- Composite indexes match ownership filters and keyset pagination, rather than
-- adding more single-column indexes to already indexed small tables.
CREATE INDEX IF NOT EXISTS placed_unsettled_page ON public.placed(username,id DESC) WHERE won='null';
CREATE INDEX IF NOT EXISTS placed_settled_page ON public.placed(username,id DESC) WHERE won<>'null';
CREATE INDEX IF NOT EXISTS placed_user_created ON public.placed(username,created_at DESC);
CREATE INDEX IF NOT EXISTS notification_user_page ON public.notification(username,id DESC);
CREATE INDEX IF NOT EXISTS notification_successful_deposit ON public.notification(username,created_at DESC)
  WHERE type='deposit' AND lower(coalesce(sent,'')) IN ('success','true','completed');
CREATE INDEX IF NOT EXISTS app_notifications_recipient_page ON public.app_notifications(recipient_username,id DESC);
CREATE INDEX IF NOT EXISTS bets_open_start ON public.bets(tsgmt) WHERE verified=false;

CREATE FUNCTION public.process_finance_request(p_action text,p_id bigint DEFAULT NULL,p_uid text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE n public.notification%ROWTYPE; amount numeric; rate numeric; code text; percent numeric;
BEGIN
  SELECT * INTO n FROM public.notification WHERE CASE WHEN p_id IS NOT NULL THEN id=p_id ELSE uid=p_uid END FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Transaction not found'; END IF;
  IF p_action='approve' AND lower(coalesce(n.sent,'pending')) NOT IN ('success','true','completed','failed','false','processing') THEN
    amount:=n.amount;
    IF n.type='deposit' THEN
      code:=lower(trim(coalesce(nullif(n.method_currency,''),nullif(n.method,''),'usdt')));
      rate:=n.method_rate;
      IF coalesce(rate,0)<=0 THEN
        SELECT rates INTO rate FROM public.walle WHERE lower(trim(name))=code OR lower(trim(currency_code))=code ORDER BY id LIMIT 1;
        IF coalesce(rate,0)<=0 AND (code IN ('usdt','usd','tether') OR code ~ '(^|[ ()_-])(usdt|tether)($|[ ()_-])') THEN rate:=1; END IF;
      END IF;
      IF coalesce(rate,0)<=0 THEN RAISE EXCEPTION 'No saved rate found. Set a rate snapshot before approving this legacy transaction'; END IF;
      amount:=round(n.amount/rate*5000,3);
      SELECT first_deposit_bonus_percent INTO percent FROM public.admin_settings WHERE id=1 FOR SHARE;
    END IF;
  END IF;
  RETURN public.process_finance_action_atomic(p_action,n.id,NULL,amount,percent);
END; $$;

CREATE FUNCTION public.read_admin_overview() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  WITH settings AS (SELECT coalesce(membership_balance_threshold,8335) threshold FROM public.admin_settings WHERE id=1),
  months AS (SELECT generate_series(date_trunc('month',now())-interval '5 months',date_trunc('month',now()),interval '1 month') bucket),
  finance AS (SELECT date_trunc('month',created_at) bucket,sum(amount) FILTER(WHERE type='deposit') deposits,
    sum(amount) FILTER(WHERE type IN ('withdraw','withdrawer')) withdrawals FROM public.notification
    WHERE created_at>=date_trunc('month',now())-interval '5 months' GROUP BY 1),
  bets AS (SELECT date_trunc('month',created_at) bucket,count(*) bets FROM public.placed
    WHERE created_at>=date_trunc('month',now())-interval '5 months' GROUP BY 1)
  SELECT jsonb_build_object('membershipBalanceThreshold',coalesce((SELECT threshold FROM settings),8335),
    'totalUsers',(SELECT count(*) FROM public.users),
    'activeUsers',(SELECT count(*) FROM public.users WHERE balance>=coalesce((SELECT threshold FROM settings),8335)),
    'betsToday',(SELECT count(*) FROM public.placed WHERE created_at>=date_trunc('day',timezone('UTC',now()))),
    'pendingTransactions',(SELECT count(*) FROM public.notification WHERE lower(coalesce(sent,'pending'))='pending' AND address IS DISTINCT FROM 'admin'),
    'reading',(SELECT to_jsonb(r) FROM public.reading r WHERE id=1),
    'notifications',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT * FROM public.notification WHERE address IS DISTINCT FROM 'admin' ORDER BY id DESC LIMIT 8) r),'[]'::jsonb),
    'latestUsers',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT username,uid,created_at,balance,totald,firstd,countrycode,newrefer FROM public.users ORDER BY id DESC LIMIT 6) r),'[]'::jsonb),
    'matches',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT * FROM public.bets WHERE verified=false ORDER BY id DESC LIMIT 6) r),'[]'::jsonb),
    'placed',coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM (SELECT * FROM public.placed ORDER BY created_at DESC LIMIT 4) r),'[]'::jsonb),
    'charts',(SELECT jsonb_agg(jsonb_build_object('key',to_char(m.bucket,'YYYY-MM'),'label',to_char(m.bucket,'Mon'),
      'deposits',coalesce(f.deposits,0),'withdrawals',coalesce(f.withdrawals,0),'bets',coalesce(b.bets,0)) ORDER BY m.bucket)
      FROM months m LEFT JOIN finance f USING(bucket) LEFT JOIN bets b USING(bucket)))
$$;

CREATE FUNCTION public.read_bet_history(p_userid text,p_limit integer DEFAULT 31,p_cursor jsonb DEFAULT '{}',p_summary boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE owner text; open_rows jsonb; closed_rows jsonb; total_open bigint;
BEGIN
  SELECT username INTO owner FROM public.users WHERE userid=p_userid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT coalesce(jsonb_agg(row),'[]'::jsonb) INTO open_rows FROM (
    SELECT CASE WHEN b.match_id IS NULL THEN to_jsonb(p) ELSE to_jsonb(p)||jsonb_build_object('tsgmt',b.tsgmt,'match_date',b.date,'match_time',b.time) END row
    FROM public.placed p LEFT JOIN public.bets b ON b.match_id=p.match_id WHERE p.username=owner AND p.won='null'
      AND NOT (p_cursor ? 'unsettled' AND p_cursor->>'unsettled' IS NULL)
      AND (p_cursor->>'unsettled' IS NULL OR p.id<(p_cursor->>'unsettled')::bigint)
    ORDER BY p.id DESC LIMIT least(1001,greatest(1,p_limit))) records;
  IF p_summary THEN
    SELECT count(*) INTO total_open FROM public.placed WHERE username=owner AND won='null'; closed_rows:='[]';
  ELSE
    SELECT coalesce(jsonb_agg(row),'[]'::jsonb) INTO closed_rows FROM (
      SELECT CASE WHEN b.match_id IS NULL THEN to_jsonb(p) ELSE to_jsonb(p)||jsonb_build_object('tsgmt',b.tsgmt,'match_date',b.date,'match_time',b.time) END row
      FROM public.placed p LEFT JOIN public.bets b ON b.match_id=p.match_id WHERE p.username=owner AND p.won<>'null'
        AND NOT (p_cursor ? 'settled' AND p_cursor->>'settled' IS NULL)
        AND (p_cursor->>'settled' IS NULL OR p.id<(p_cursor->>'settled')::bigint)
      ORDER BY p.id DESC LIMIT least(1001,greatest(1,p_limit))) records;
  END IF;
  RETURN jsonb_build_object('unsettled',open_rows,'settled',closed_rows,'totalUnsettled',total_open);
END; $$;

CREATE FUNCTION public.read_transaction_history(p_userid text,p_filter text DEFAULT 'all',p_limit integer DEFAULT 31,p_cursor jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; rows jsonb; total bigint;
BEGIN
  SELECT * INTO u FROM public.users WHERE userid=p_userid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) INTO rows FROM (
    SELECT * FROM public.notification WHERE username=u.username AND type IN ('deposit','withdraw','withdrawer')
      AND (p_filter='all' OR p_filter='deposit' AND type='deposit' OR p_filter='withdraw' AND type IN ('withdraw','withdrawer'))
      AND NOT (p_cursor ? 'transactions' AND p_cursor->>'transactions' IS NULL)
      AND (p_cursor->>'transactions' IS NULL OR id<(p_cursor->>'transactions')::bigint)
    ORDER BY id DESC LIMIT least(1001,greatest(1,p_limit))) r;
  SELECT count(*) INTO total FROM public.notification WHERE username=u.username AND type IN ('deposit','withdraw','withdrawer')
    AND (p_filter='all' OR p_filter='deposit' AND type='deposit' OR p_filter='withdraw' AND type IN ('withdraw','withdrawer'));
  RETURN jsonb_build_object('profile',jsonb_build_object('username',u.username,'totald',u.totald,'totalw',u.totalw),
    'rows',rows,'count',total,'methods',coalesce((SELECT jsonb_agg(to_jsonb(m)) FROM public.walle m),'[]'::jsonb));
END; $$;

CREATE FUNCTION public.read_referral_history(p_userid text,p_limit integer DEFAULT 21,p_cursor jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE ref text; threshold numeric; result jsonb:='{}'; col text; rows jsonb;
BEGIN
  SELECT newrefer INTO ref FROM public.users WHERE userid=p_userid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  SELECT coalesce(membership_balance_threshold,8335) INTO threshold FROM public.admin_settings WHERE id=1;
  FOREACH col IN ARRAY ARRAY['refer','lvla','lvlb'] LOOP
    IF p_cursor ? col AND p_cursor->>col IS NULL THEN rows:='[]';
    ELSE
      EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM (SELECT id,username,totald,balance,firstd,refer,lvla,lvlb,created_at FROM public.users WHERE %I=$1 AND ($2 IS NULL OR id<$2::bigint) ORDER BY id DESC LIMIT $3) r',col)
        INTO rows USING ref,p_cursor->>col,least(1001,greatest(1,p_limit));
    END IF;
    result:=result||jsonb_build_object(col,rows);
  END LOOP;
  RETURN jsonb_build_object('refer',ref,'membershipBalanceThreshold',coalesce(threshold,8335),'levels',result);
END; $$;

CREATE FUNCTION public.read_notification_sources(p_userid text,p_limit integer DEFAULT 26,p_cursor jsonb DEFAULT '{}')
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE u public.users%ROWTYPE; source text; table_name text; predicate text; owner text; rows jsonb; result jsonb:='{}'; unread bigint;
BEGIN
  SELECT * INTO u FROM public.users WHERE userid=p_userid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Profile not found'; END IF;
  FOREACH source IN ARRAY ARRAY['app','bonus','broadcast','bet','firstDeposit','transaction','reward'] LOOP
    owner:=u.username;
    CASE source
      WHEN 'app' THEN table_name:='app_notifications'; predicate:='recipient_username=$1';
      WHEN 'bonus' THEN table_name:='activa'; predicate:='code=$1'; owner:=u.newrefer;
      WHEN 'broadcast' THEN table_name:='activa'; predicate:='code=$1'; owner:='broadcast';
      WHEN 'bet' THEN table_name:='activa'; predicate:='username=$1 AND code=''bet''';
      WHEN 'firstDeposit' THEN table_name:='activa'; predicate:='username=$1 AND code=''firstdepositbonus''';
      WHEN 'transaction' THEN table_name:='notification'; predicate:='username=$1 AND sent IN (''success'',''failed'')';
      WHEN 'reward' THEN table_name:='notification'; predicate:='username=$1 AND address=''admin''';
    END CASE;
    IF p_cursor ? source AND p_cursor->>source IS NULL THEN rows:='[]';
    ELSE
      EXECUTE format('SELECT coalesce(jsonb_agg(to_jsonb(r)),''[]''::jsonb) FROM (SELECT * FROM public.%I WHERE %s AND ($2 IS NULL OR id<$2::bigint) ORDER BY id DESC LIMIT $3) r',table_name,predicate)
        INTO rows USING owner,p_cursor->>source,least(1001,greatest(1,p_limit));
    END IF;
    result:=result||jsonb_build_object(source,rows);
  END LOOP;
  SELECT count(*) INTO unread FROM public.app_notifications WHERE recipient_username=u.username AND read_at IS NULL;
  RETURN jsonb_build_object('profile',jsonb_build_object('username',u.username,'newrefer',u.newrefer),'sources',result,'unreadCount',unread);
END; $$;

CREATE FUNCTION public.mark_customer_notifications_read(p_userid text,p_ids bigint[] DEFAULT NULL)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  UPDATE public.app_notifications n SET read_at=now() FROM public.users u WHERE u.userid=p_userid
    AND n.recipient_username=u.username AND n.read_at IS NULL AND (p_ids IS NULL OR n.id=ANY(p_ids));
  RETURN true;
END; $$;

DO $$ DECLARE fn record; BEGIN
  FOR fn IN SELECT oid::regprocedure AS signature FROM pg_proc WHERE pronamespace='public'::regnamespace
    AND proname IN ('claim_notification_jobs','finish_notification_job','record_notification_job','create_deposit_request_atomic',
      'submit_withdrawal_atomic','bind_wallet_atomic','read_customer_profile','read_payment_state',
      'read_bet_history','read_transaction_history','read_referral_history','read_notification_sources','mark_customer_notifications_read',
      'process_finance_request','read_admin_overview','place_bet_atomic','place_native_bet_atomic') LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',fn.signature);
  END LOOP;
END; $$;
