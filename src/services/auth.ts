import { api, unwrap, type ApiResponse } from '@/lib/api'

export interface LoginPayload {
  username: string
  password: string
  remember: boolean
}

export interface RegisterPayload {
  username: string
  password: string
  phone: string
}

export interface User {
  userId: number
  createdAt: string
  updatedAt: string
  username: string
  loginChannel: number
  unionId: string
  openId: string
  alipayUid: string
  nickname: string
  phone: string
  email: string
  avatar: string
  gender: number
  status: number
  lastLoginIp: string
  lastLoginAt: string
}

interface LoginData {
  token: string
  user: User
}

export interface AuthResult {
  token: string
  username: string
  user: User
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  const data = await unwrap(
    api<ApiResponse<LoginData>>('/user/login', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
      }),
    }),
  )
  return {
    token: data.token,
    username: data.user.username,
    user: data.user,
  }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  const data = await unwrap(
    api<ApiResponse<LoginData>>('/user/register', {
      method: 'POST',
      body: JSON.stringify({
        username: payload.username,
        password: payload.password,
        phone: payload.phone,
      }),
    }),
  )
  return {
    token: data.token,
    username: data.user.username,
    user: data.user,
  }
}
