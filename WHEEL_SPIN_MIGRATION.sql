-- Visual spin result only. No balance or reward is granted.
-- No client policies: the authenticated API route uses the service role.
CREATE TABLE IF NOT EXISTS public.wheel_spin_state (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  spun_at timestamptz NOT NULL,
  prize_index smallint NOT NULL CHECK (prize_index BETWEEN 0 AND 7)
);

ALTER TABLE public.wheel_spin_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wheel_spin_state FROM anon, authenticated;
