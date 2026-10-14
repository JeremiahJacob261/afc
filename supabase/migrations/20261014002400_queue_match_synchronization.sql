ALTER TABLE public.notification_jobs DROP CONSTRAINT notification_jobs_kind_check;
ALTER TABLE public.notification_jobs ADD CONSTRAINT notification_jobs_kind_check
  CHECK (kind IN ('team','finance','settlement','company_match','wheel_push','receipt_cleanup','match_sync'));
CREATE FUNCTION public.enqueue_match_sync() RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.notification_jobs WHERE kind='match_sync' AND state IN ('queued','running')) THEN RETURN false; END IF;
  INSERT INTO public.notification_jobs(event_key,kind,payload)
    VALUES('match_sync:'||floor(extract(epoch from now())/300)::text,'match_sync','{}'::jsonb)
    ON CONFLICT(event_key) DO NOTHING;
  RETURN FOUND;
END; $$;
REVOKE ALL ON FUNCTION public.enqueue_match_sync() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_match_sync() TO service_role;
