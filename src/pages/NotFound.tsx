import { Link } from 'react-router'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

function NotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>404 - 页面不存在</EmptyTitle>
          <EmptyDescription>你访问的地址不存在或已被移除。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            to="/"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            返回首页
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export default NotFound
