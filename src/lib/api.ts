/**
 * fetch 封装。统一处理 BASE_URL、JSON 序列化和错误。
 *
 * 用法:
 *   const user = await api<User>('/user/1')
 *   await api<void>('/auth/login', {
 *     method: 'POST',
 *     body: JSON.stringify(payload),
 *   })
 *
 * 接真实后端时在 .env 里配置:
 *   VITE_API_URL=http://localhost:3000
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: options.signal ?? AbortSignal.timeout(10_000),
  })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string }
    throw new ApiError(res.status, body.message ?? `请求失败 (${res.status})`)
  }

  return res.json() as Promise<T>
}
