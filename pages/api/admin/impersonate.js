import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

function httpError(statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function getRequestIp(req) {
  const forwardedFor = req.headers['x-forwarded-for']
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.socket?.remoteAddress || ''
}

function createPublicAuthClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw httpError(500, 'Missing Supabase public auth configuration')
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}

async function writeAudit(supabase, req, payload) {
  try {
    const { error } = await supabase
      .from('admin_impersonation_audit')
      .insert({
        target_userid: payload.targetUserid || null,
        target_uid: payload.targetUid || null,
        target_username: payload.targetUsername || null,
        target_email: payload.targetEmail || null,
        status: payload.status,
        error_message: payload.errorMessage || null,
        ip_address: getRequestIp(req) || null,
        user_agent: req.headers['user-agent'] || null,
      })

    if (error) {
      console.warn('Admin impersonation audit insert failed:', error)
    }
  } catch (error) {
    console.warn('Admin impersonation audit insert failed:', error)
  }
}

function serializeSession(session) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  const uid = String(req.body?.uid || '').trim()
  let supabase = null
  let targetUser = null

  try {
    requireAdmin(req)

    if (!uid) {
      throw httpError(400, 'Missing user id')
    }

    supabase = getSupabaseAdmin()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('userid,uid,username,email')
      .eq('uid', uid)
      .maybeSingle()

    if (userError) throw userError
    if (!user) {
      throw httpError(404, 'User not found')
    }

    targetUser = user

    if (!user.email || !user.userid) {
      throw httpError(400, 'Target user is missing login details')
    }

    const { data: authUserData, error: authUserError } = await supabase.auth.admin.getUserById(user.userid)
    if (authUserError) throw authUserError

    const authEmail = authUserData?.user?.email || ''
    if (!authUserData?.user?.id || authEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw httpError(400, 'Target user profile does not match Supabase Auth')
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkError) throw linkError

    const generatedUserId = linkData?.user?.id
    const tokenHash = linkData?.properties?.hashed_token

    if (!generatedUserId || generatedUserId !== user.userid) {
      throw httpError(400, 'Generated login link does not match this user')
    }

    if (!tokenHash) {
      throw httpError(500, 'Supabase did not return a login token')
    }

    const authClient = createPublicAuthClient()
    const { data: authData, error: verifyError } = await authClient.auth.verifyOtp({
      type: 'magiclink',
      token_hash: tokenHash,
    })

    if (verifyError) throw verifyError

    if (!authData?.session?.access_token || !authData?.session?.refresh_token) {
      throw httpError(500, 'Supabase did not return a user session')
    }

    await writeAudit(supabase, req, {
      targetUserid: user.userid,
      targetUid: user.uid,
      targetUsername: user.username,
      targetEmail: user.email,
      status: 'success',
    })

    return res.status(200).json({
      status: 'success',
      session: serializeSession(authData.session),
      user: {
        id: authData.user?.id || user.userid,
        email: authData.user?.email || user.email,
      },
    })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message

    if (supabase) {
      await writeAudit(supabase, req, {
        targetUserid: targetUser?.userid,
        targetUid: targetUser?.uid || uid,
        targetUsername: targetUser?.username,
        targetEmail: targetUser?.email,
        status: 'error',
        errorMessage: error.message,
      })
    }

    console.error('Admin impersonation error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
