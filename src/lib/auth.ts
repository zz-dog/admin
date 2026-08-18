/** 登录态(token)的存取,基于 localStorage */

const TOKEN_KEY = 'auth_token'
const USERNAME_KEY = 'auth_username'

export function saveAuth(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USERNAME_KEY, username)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getUsername() {
  return localStorage.getItem(USERNAME_KEY)
}

export function isLoggedIn() {
  return getToken() !== null
}
