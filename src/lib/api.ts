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

import { clearAuth, getToken } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** 后端统一响应结构 */
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/** 解包统一响应结构,code !== 0 视为业务错误 */
export async function unwrap<T>(promise: Promise<ApiResponse<T>>): Promise<T> {
  const res = await promise;
  if (res.code !== 0) {
    throw new Error(res.message || "请求失败");
  }
  return res.data;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    signal: options.signal ?? AbortSignal.timeout(10_000),
  });

  if (res.status === 401 && getToken()) {
    // 登录态失效(token 过期/无效):清除本地凭证并跳转登录页。
    // 没有 token 时的 401(如登录接口密码错误)走正常报错,不跳转。
    clearAuth();
    window.location.assign("/login");
    throw new ApiError(401, "登录已过期,请重新登录");
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(res.status, body.message ?? `请求失败 (${res.status})`);
  }

  return res.json() as Promise<T>;
}
