-- Keep the existing public-folder upload policy and permit owners to discard their new receipts.
CREATE OR REPLACE FUNCTION private.queue_receipt_cleanup() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
  IF NEW.bucket_id<>'trcreceipt' OR (NEW.name NOT LIKE 'web/%' AND NEW.name NOT LIKE 'public/web/%') THEN RETURN NEW; END IF;
  INSERT INTO public.notification_jobs(event_key,kind,payload,available_at)
    VALUES('receipt_cleanup:'||NEW.name,'receipt_cleanup',jsonb_build_object('path',NEW.name),now()+interval '48 hours')
    ON CONFLICT(event_key) DO NOTHING;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION private.queue_receipt_cleanup() FROM PUBLIC,anon,authenticated,service_role;

CREATE POLICY afc_receipts_select_own ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='trcreceipt' AND owner_id=(SELECT auth.uid())::text AND name LIKE 'public/web/%');
CREATE POLICY afc_receipts_delete_own ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='trcreceipt' AND owner_id=(SELECT auth.uid())::text AND name LIKE 'public/web/%');

CREATE OR REPLACE FUNCTION public.create_deposit_request_atomic(p_userid text,p_amount numeric,p_method text,
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
  IF p_receipt LIKE '%/storage/v1/object/public/trcreceipt/web/%' OR p_receipt LIKE '%/storage/v1/object/public/trcreceipt/public/web/%' THEN
    IF split_part(p_receipt,'/trcreceipt/',2) NOT LIKE 'web/'||p_userid||'/%' AND split_part(p_receipt,'/trcreceipt/',2) NOT LIKE 'public/web/'||p_userid||'/%' THEN RAISE EXCEPTION 'Invalid receipt owner'; END IF;
    PERFORM 1 FROM storage.objects WHERE bucket_id='trcreceipt' AND name=split_part(p_receipt,'/trcreceipt/',2)
      AND owner_id=p_userid AND created_at>now()-interval '24 hours' FOR SHARE;
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
