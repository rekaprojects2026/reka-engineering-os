// Service-role Supabase client — server only.
// Used for admin operations that bypass RLS (auth.admin.createUser, etc.)
// NEVER import this in client components or expose to the browser.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
