import { useEffect, useState } from 'react'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import type { User } from '@/services/auth'
import { listUsers } from '@/services/users'

const PAGE_SIZE = 10

/** 查询条件(page 也在内,翻页/搜索都通过改它触发请求) */
interface UserQuery {
  page: number
  userId: string
  username: string
}

const genderText: Record<number, string> = {
  0: '未知',
  1: '男',
  2: '女',
}

function formatValue(value: string | null | undefined) {
  return value || '-'
}

function UsersPage() {
  const [query, setQuery] = useState<UserQuery>({
    page: 1,
    userId: '',
    username: '',
  })
  // 输入框单独存值,点搜索才生效
  const [userIdInput, setUserIdInput] = useState('')
  const [usernameInput, setUsernameInput] = useState('')
  const [data, setData] = useState<{ list: User[]; total: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    listUsers({
      page: query.page,
      pageSize: PAGE_SIZE,
      userId: query.userId ? Number(query.userId) : undefined,
      username: query.username || undefined,
      signal: controller.signal,
    })
      .then((res) => {
        setData(res)
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e.message : '加载失败,请稍后重试')
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })
    return () => controller.abort()
  }, [query])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setQuery({
      page: 1,
      userId: userIdInput.trim(),
      username: usernameInput.trim(),
    })
  }

  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-muted-foreground text-sm">
          查询和管理平台注册用户。
        </p>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={handleSearch}
      >
        <Input
          type="text"
          inputMode="numeric"
          className="w-32"
          placeholder="用户 ID"
          value={userIdInput}
          onChange={(e) => setUserIdInput(e.target.value)}
        />
        <Input
          type="text"
          className="w-44"
          placeholder="用户名"
          value={usernameInput}
          onChange={(e) => setUsernameInput(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          <SearchIcon data-icon="inline-start" />
          搜索
        </Button>
      </form>

      {error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>加载失败</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => setQuery({ ...query })}
            disabled={loading}
          >
            重试
          </Button>
        </Empty>
      ) : loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Spinner data-icon="inline-start" />
          加载中…
        </div>
      ) : data && data.list.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {['ID', '用户名', '昵称', '性别', '手机号', '邮箱', '状态', '最后登录', '注册时间'].map(
                  (title) => (
                    <th key={title} className="px-3 py-2.5 text-left font-medium">
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.list.map((user) => (
                <tr key={user.userId} className="border-t">
                  <td className="px-3 py-2.5">{user.userId}</td>
                  <td className="px-3 py-2.5 font-medium">{user.username}</td>
                  <td className="px-3 py-2.5">{formatValue(user.nickname)}</td>
                  <td className="px-3 py-2.5">
                    {genderText[user.gender] ?? '未知'}
                  </td>
                  <td className="px-3 py-2.5">{formatValue(user.phone)}</td>
                  <td className="px-3 py-2.5">{formatValue(user.email)}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        user.status === 1
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-muted-foreground'
                      }
                    >
                      {user.status === 1 ? '正常' : '禁用'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatValue(user.lastLoginAt)}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatValue(user.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无用户</EmptyTitle>
            <EmptyDescription>没有找到符合条件的用户。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && data.list.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            共 {total} 条 · 第 {query.page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="上一页"
              disabled={query.page <= 1 || loading}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="下一页"
              disabled={query.page >= totalPages || loading}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
