export async function callAdminRpc(functionName, params = {}) {
  try {
    const response = await fetch('/api/admin/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ functionName, params }),
    })
    const json = await response.json()

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/admin'
      }
      return { data: null, error: { message: json.message || 'RPC call failed' } }
    }

    return { data: json.data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
