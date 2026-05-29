/**
 * RPC Helper - Wrapper for backend RPC functions
 * Use this instead of supabase.rpc() for cleaner code
 */

const BASE_URL = typeof window === 'undefined' 
  ? `http://localhost:${process.env.PORT || 3000}`
  : ''

/**
 * Call a backend RPC function
 * @param {string} functionName - Name of the RPC function
 * @param {object} params - Parameters to pass
 * @returns {Promise<{data, error}>}
 */
export async function callRpc(functionName, params = {}) {
  try {
    const response = await fetch(`${BASE_URL}/api/rpc/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    const json = await response.json()

    if (!response.ok) {
      return { data: null, error: { message: json.error || json.message || 'Unknown error' } }
    }

    return { data: json, error: null }
  } catch (error) {
    console.error(`RPC call failed for ${functionName}:`, error)
    return { data: null, error }
  }
}

// Convenience functions for common operations
export const rpc = {
  depositor: (names, amount) => callRpc('depositor', { names, amount }),
  withdrawer: (names, amount) => callRpc('withdrawer', { names, amount }),
  dailywl: (names, amount) => callRpc('dailywl', { names, amount }),
  gatherd: (names, amount) => callRpc('gatherd', { names, amount }),
  gatherw: (names, amount) => callRpc('gatherw', { names, amount }),
  chan: (bet, des) => callRpc('chan', { bet, des }),
  increment: (x, row_id) => callRpc('increment', { x, row_id }),
  affbonus: (name, type, amount, refers, lvls, lvlss, sourceUsername = name) =>
    callRpc('affbonus', { name, sourceUsername, type, amount, refers, lvls, lvlss }),
  refbonus: (amount, name, refers, lvls, lvlss) =>
    callRpc('refbonus', { amount, name, refers, lvls, lvlss }),
  readdeposit: (amount) => callRpc('readdeposit', { amount }),
  readwithdraw: (amount) => callRpc('readwithdraw', { amount }),
  self: (name, amount) => callRpc('self', { name, amount }),
  processBets: (name) => callRpc('process_bets', { name })
}

export default rpc
