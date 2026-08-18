import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'

function Dashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">仪表盘</h1>
        <p className="text-muted-foreground text-sm">
          欢迎使用管理后台,这里将展示核心数据概览。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {['今日活跃', '新增用户', '总访问量'].map((title) => (
          <Card key={title}>
            <CardHeader>
              <CardDescription>{title}</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">
              等待接入数据
            </CardContent>
          </Card>
        ))}
      </div>
      <Empty>
        <EmptyHeader>
          <EmptyTitle>暂无图表</EmptyTitle>
          <EmptyDescription>
            接入 TanStack Query 和 Chart 组件后,这里会展示趋势图。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  )
}

export default Dashboard
