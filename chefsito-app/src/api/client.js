const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export function getToken() {
  return localStorage.getItem('chefsito_token')
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('chefsito_token', token)
  } else {
    localStorage.removeItem('chefsito_token')
  }
}

export async function api(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getToken()

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message ?? 'Error en la solicitud')
  }

  return data
}
