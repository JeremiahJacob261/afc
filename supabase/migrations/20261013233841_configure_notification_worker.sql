-- Apply after /api/jobs/notifications has deployed. The secret stays encrypted
-- in Vault; only its hash is accessible to the server-side claim RPC.
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
DO $$ DECLARE secret text; BEGIN
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name='afc_notification_worker';
  IF secret IS NULL THEN
    secret:=encode(extensions.gen_random_bytes(32),'hex');
    PERFORM vault.create_secret(secret,'afc_notification_worker','Internal notification worker credential');
  END IF;
  INSERT INTO private.notification_worker_credentials(id,token_hash)
    VALUES(true,extensions.digest(secret,'sha256')) ON CONFLICT(id) DO UPDATE SET token_hash=excluded.token_hash;
END; $$;

CREATE FUNCTION private.dispatch_notification_jobs() RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE secret text; request_id bigint;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.notification_jobs WHERE available_at<=now()
    AND (state='queued' OR state='running' AND leased_until<now())) THEN RETURN NULL; END IF;
  SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name='afc_notification_worker';
  IF secret IS NULL THEN RAISE EXCEPTION 'Notification worker credential is missing'; END IF;
  SELECT net.http_post(url:='https://www.ucl01.com/api/jobs/notifications',
    headers:=jsonb_build_object('Content-Type','application/json','x-job-secret',secret),
    body:='{}'::jsonb,timeout_milliseconds:=28000) INTO request_id;
  RETURN request_id;
END; $$;
REVOKE ALL ON FUNCTION private.dispatch_notification_jobs() FROM PUBLIC,anon,authenticated,service_role;
SELECT cron.schedule('afc-notification-worker','* * * * *','SELECT private.dispatch_notification_jobs();');
SELECT cron.schedule('afc-notification-job-retention','15 3 * * *',
  $$DELETE FROM public.notification_jobs WHERE state='done' AND completed_at<now()-interval '14 days';$$);
