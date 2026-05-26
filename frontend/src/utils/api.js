export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const API = (path, options = {}) => {
  const token = localStorage.getItem('token')
  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
}
