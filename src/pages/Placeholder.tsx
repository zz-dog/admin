import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>页面建设中</EmptyTitle>
          <EmptyDescription>这个页面还没有实现,敬请期待。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export function UsersPage() {
  return <Placeholder title="用户管理" />
}

export function SettingsPage() {
  return <Placeholder title="设置" />
}
