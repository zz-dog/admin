import { api } from '@/lib/api'

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

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
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

/** 解包统一响应结构,code !== 0 视为业务错误 */
async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise
  if (res.code !== 0) {
    throw new Error(res.message || '请求失败')
  }
  return res.data
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
