
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://aidkzrgsgrfotjiouxto.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGt6cmdzZ3Jmb3RqaW91eHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2ODQwODMwMiwiZXhwIjoxOTgzOTg0MzAyfQ.pYEZHag6dPdqQWgApbgCBoV-pxSUWgPPqIy0adJoTgk', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Access auth admin api
export const adminAuthClient = supabase.auth.admin;