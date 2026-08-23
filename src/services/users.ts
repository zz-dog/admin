import { api, unwrap, type ApiResponse } from '@/lib/api'
import type { User } from './auth'

export interface UserListParams {
  page: number
  pageSize: number
  userId?: number
  username?: string
  signal?: AbortSignal
}

export interface UserListData {
  list: User[]
  total: number
}

export async function listUsers(params: UserListParams): Promise<UserListData> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  })
  if (params.userId != null) {
    search.set('userId', String(params.userId))
  }
  if (params.username) {
    search.set('username', params.username)
  }
  return unwrap(
    api<ApiResponse<UserListData>>(`/user/list?${search.toString()}`, {
      signal: params.signal,
    }),
  )
}
