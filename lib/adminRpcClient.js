function getAdminPassword() {
  if (typeof window === 'undefined') return ''

  let password = window.sessionStorage.getItem('adminActionPassword')
  if (!password) {
    password = window.prompt('Admin password') || ''
    if (password) {
      window.sessionStorage.setItem('adminActionPassword', password)
    }
  }

  return password
}

export async function callAdminRpc(functionName, params = {}) {
  const password = getAdminPassword()
  if (!password) {
    return { data: null, error: { message: 'Admin password required' } }
  }

  try {
    const response = await fetch('/api/admin/rpc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ functionName, params }),
    })
    const json = await response.json()

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        window.sessionStorage.removeItem('adminActionPassword')
      }
      return { data: null, error: { message: json.message || 'RPC call failed' } }
    }

    return { data: json.data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}
