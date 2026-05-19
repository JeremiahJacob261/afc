import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

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
    realtime: {
      transport: ws,
    },
  }
const supabaseUrl = 'https://pctajnbqkposgymgbqkc.supabase.co'
//eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZGt6cmdzZ3Jmb3RqaW91eHRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODg2NjUyOCwiZXhwIjoyMDE0NDQyNTI4fQ.h09NvD6I8MMj5kqOvjyGB0PlZWz9wwk_FqdqCNboRkU
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjdGFqbmJxa3Bvc2d5bWdicWtjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTE1OTExOSwiZXhwIjoyMDk0NzM1MTE5fQ.LUnJucQCYOCq50xLStowZ4hj9bJ8ZY8XNe96XepcDQQ'

export const supabase = createClient(supabaseUrl, supabaseKey, options)