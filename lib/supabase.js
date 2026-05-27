import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kfavxnblcyohkpfknbme.supabase.co'
const SUPABASE_KEY = 'sb_publishable_5fL2UsgYnCq7xzttBklPbw_4fDlUd7T'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function dbSave(key, value) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_data').upsert(
    { user_id: user.id, key, value, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' }
  )
}

export async function dbLoadAll() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data, error } = await supabase.from('user_data').select('key, value').eq('user_id', user.id)
  if (error) return null
  return (data || []).reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {})
}
