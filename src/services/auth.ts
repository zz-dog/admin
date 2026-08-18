/**
 * 认证相关接口。
 *
 * 当前使用假数据模拟,接真实后端时:
 * 把这里的实现换成 api() 调用即可(见 src/lib/api.ts),
 * 函数签名和类型保持不变,组件层无需改动。
 */
export interface LoginPayload {
  username: string
  password: string
  remember: boolean
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
}

export interface AuthResult {
  token: string
  username: string
}

/** 模拟网络延迟 */
function delay(ms = 800) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 已注册的假账号,密码统一为 123456 */
const DEMO_USERS = [
  { username: 'demo', email: 'demo@example.com', password: '123456' },
  { username: 'admin', email: 'admin@example.com', password: '123456' },
]

function fakeToken(username: string) {
  return btoa(`fake-token:${username}:${Date.now()}`)
}

export async function login(payload: LoginPayload): Promise<AuthResult> {
  // TODO: 接真实后端时替换为:
  // return api<AuthResult>('/auth/login', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // })
  await delay()
  const user = DEMO_USERS.find((u) => u.username === payload.username)
  if (!user || user.password !== payload.password) {
    throw new Error('用户名或密码错误')
  }
  return { token: fakeToken(user.username), username: user.username }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
  // TODO: 接真实后端时替换为:
  // return api<AuthResult>('/auth/register', {
  //   method: 'POST',
  //   body: JSON.stringify(payload),
  // })
  await delay()
  if (DEMO_USERS.some((u) => u.username === payload.username)) {
    throw new Error('用户名已被占用')
  }
  DEMO_USERS.push({
    username: payload.username,
    email: payload.email,
    password: payload.password,
  })
  return { token: fakeToken(payload.username), username: payload.username }
}
