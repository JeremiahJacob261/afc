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
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGt6cmdzZ3Jmb3RqaW91eHRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg4NjY1MjgsImV4cCI6MjAxNDQ0MjUyOH0.rFOiNQGULsQMU77DlwFDZSFnH5g3yOYz7N9ANnIz4sc'

export const supabase = createClient(supabaseUrl, supabaseKey)