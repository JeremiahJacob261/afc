import { requireAdmin } from '@/lib/adminAuth'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

const REFERRAL_PAGE_SIZE = 1000

function referralCode(value) {
  const code = String(value ?? '').trim()
  return code || null
}

async function getAllReferralUsers(supabase) {
  const users = []

  for (let from = 0; ; from += REFERRAL_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('users')
      .select('id,uid,username,newrefer,refer,lvla,lvlb')
      .order('id', { ascending: true })
      .range(from, from + REFERRAL_PAGE_SIZE - 1)

    if (error) throw error

    const page = data || []
    users.push(...page)
    if (page.length < REFERRAL_PAGE_SIZE) break
  }

  return users
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' })
  }

  try {
    requireAdmin(req)
    const { action, username, uid, newBalance, currentRefer, newRefer } = req.body || {}
    const supabase = getSupabaseAdmin()

    if (action === 'update-balance') {
      const amount = Number(newBalance)
      if (!username || !Number.isFinite(amount)) {
        return res.status(400).json({ status: 'error', message: 'Invalid balance update' })
      }

      const { error } = await supabase
        .from('users')
        .update({ balance: amount })
        .eq('username', username)

      if (error) throw error
      return res.status(200).json({ status: 'success' })
    }

    if (action === 'delete-wallet') {
      const requestedUid = String(uid || '').trim()
      const requestedUsername = String(username || '').trim()

      if (!requestedUid && !requestedUsername) {
        return res.status(400).json({ status: 'error', message: 'Missing user id' })
      }

      let walletOwnerId = requestedUid

      if (!walletOwnerId) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('uid,userid')
          .eq('username', requestedUsername)
          .maybeSingle()

        if (userError) throw userError
        if (!user) {
          return res.status(404).json({ status: 'error', message: 'User not found' })
        }

        walletOwnerId = user.uid || user.userid
      }

      const { data: deletedWallets, error } = await supabase
        .from('user_wallets')
        .delete()
        .eq('uid', walletOwnerId)
        .select('id')

      if (error) throw error

      const deletedCount = deletedWallets?.length || 0
      if (deletedCount === 0) {
        return res.status(404).json({ status: 'error', message: 'No linked wallet found for this user' })
      }

      return res.status(200).json({
        status: 'success',
        deletedCount,
        message: `${deletedCount} wallet record${deletedCount === 1 ? '' : 's'} deleted`,
      })
    }

    if (action === 'switch-referral') {
      const requestedUid = String(uid || '').trim()
      const requestedUsername = String(username || '').trim()
      const requestedCurrentRefer = referralCode(currentRefer)
      const requestedNewRefer = referralCode(newRefer)

      if ((!requestedUid && !requestedUsername && !requestedCurrentRefer) || !requestedNewRefer) {
        return res.status(400).json({ status: 'error', message: 'Missing referral details' })
      }

      // Supabase/PostgREST commonly caps a response at 1,000 rows. Paginate so
      // users beyond that limit cannot be silently skipped.
      const allUsers = await getAllReferralUsers(supabase)
      const usersByCode = new Map(
        allUsers
          .map((user) => [referralCode(user.newrefer), user])
          .filter(([code]) => code)
      )

      const target = requestedUid
        ? allUsers.find((user) => String(user.uid || '') === requestedUid)
        : requestedUsername
          ? allUsers.find((user) => String(user.username || '') === requestedUsername)
          : usersByCode.get(requestedCurrentRefer)

      if (!target) {
        return res.status(404).json({ status: 'error', message: 'User to move was not found' })
      }

      if (requestedCurrentRefer && referralCode(target.newrefer) !== requestedCurrentRefer) {
        return res.status(409).json({
          status: 'error',
          message: 'The user referral details changed. Refresh the page and try again.',
        })
      }

      const referrer = usersByCode.get(requestedNewRefer)
      if (!referrer) {
        return res.status(404).json({ status: 'error', message: 'New referrer not found' })
      }

      const targetCode = referralCode(target.newrefer)
      if (!targetCode) {
        return res.status(409).json({ status: 'error', message: 'The user has no referral code' })
      }

      if (targetCode === requestedNewRefer) {
        return res.status(400).json({ status: 'error', message: 'A user cannot refer themselves' })
      }

      if (referralCode(target.refer) === requestedNewRefer) {
        return res.status(409).json({
          status: 'error',
          message: `${target.username} is already a direct downline of ${requestedNewRefer}`,
        })
      }

      // Walking upward from the proposed referrer catches attempts to move a
      // user beneath one of their own downlines before any records are changed.
      const ancestorCodes = new Set()
      let ancestor = referrer
      while (ancestor) {
        const code = referralCode(ancestor.newrefer)
        if (!code) break
        if (code === targetCode) {
          return res.status(409).json({
            status: 'error',
            message: 'Cannot move a user beneath one of their own downlines',
          })
        }
        if (ancestorCodes.has(code)) {
          return res.status(409).json({ status: 'error', message: 'The new referrer has a circular referral chain' })
        }
        ancestorCodes.add(code)
        ancestor = usersByCode.get(referralCode(ancestor.refer))
      }

      const childrenByParent = new Map()
      for (const user of allUsers) {
        const parentCode = referralCode(user.refer)
        if (!parentCode) continue
        const children = childrenByParent.get(parentCode) || []
        children.push(user)
        childrenByParent.set(parentCode, children)
      }

      const queue = [{
        user: target,
        parentCode: referralCode(referrer.newrefer),
        parentRefer: referralCode(referrer.refer),
        parentLvla: referralCode(referrer.lvla),
      }]
      const visited = new Set()
      const updates = []

      while (queue.length > 0) {
        const item = queue.shift()
        if (!item?.user) continue

        const user = item.user
        const code = referralCode(user.newrefer)
        if (!code || visited.has(code)) {
          return res.status(409).json({ status: 'error', message: 'The user has a circular referral subtree' })
        }
        visited.add(code)

        const values = {
          refer: item.parentCode,
          lvla: item.parentRefer,
          lvlb: item.parentLvla,
        }
        const changed = ['refer', 'lvla', 'lvlb']
          .some((field) => referralCode(user[field]) !== values[field])
        if (changed) updates.push({ user, values })

        const children = childrenByParent.get(code) || []
        for (const child of children) {
          queue.push({
            user: child,
            parentCode: code,
            parentRefer: values.refer,
            parentLvla: values.lvla,
          })
        }
      }

      let updatedTarget = null
      for (const update of updates) {
        const { data: savedUser, error: updateError } = await supabase
          .from('users')
          .update(update.values)
          .eq('id', update.user.id)
          .select('id,uid,username,newrefer,refer,lvla,lvlb')
          .maybeSingle()

        if (updateError) throw updateError
        if (!savedUser) {
          const error = new Error(`Referral update did not save for ${update.user.username}`)
          error.statusCode = 409
          throw error
        }
        if (update.user.id === target.id) updatedTarget = savedUser
      }

      if (!updatedTarget || referralCode(updatedTarget.refer) !== requestedNewRefer) {
        const error = new Error('Referral update could not be verified')
        error.statusCode = 409
        throw error
      }

      return res.status(200).json({
        status: 'success',
        user: updatedTarget,
        updatedCount: updates.length,
        referrerUsername: referrer.username,
        message: `${target.username} is now a direct downline of ${requestedNewRefer}`,
      })
    }

    return res.status(400).json({ status: 'error', message: 'Unsupported admin action' })
  } catch (error) {
    const status = error.statusCode || 500
    const message = status === 500 ? 'Server error' : error.message
    console.error('Admin user action error:', error)
    return res.status(status).json({ status: 'error', message })
  }
}
