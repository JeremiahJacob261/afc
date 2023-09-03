import { createClient } from '@supabase/supabase-js'
const options = {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: { 'x-my-custom-header': 'my-app-name' },
    },
  }
const supabaseUrl = 'https://aidkzrgsgrfotjiouxto.supabase.co'
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGt6cmdzZ3Jmb3RqaW91eHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY2ODQwODMwMiwiZXhwIjoxOTgzOTg0MzAyfQ.pYEZHag6dPdqQWgApbgCBoV-pxSUWgPPqIy0adJoTgk"

export const supabase = createClient(supabaseUrl, supabaseKey)