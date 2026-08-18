import { Link, Outlet, useLocation, useNavigate } from 'react-router'
import {
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { clearAuth, getUsername } from '@/lib/auth'

const NAV_ITEMS = [
  { title: '仪表盘', url: '/', icon: LayoutDashboardIcon },
  { title: '用户管理', url: '/users', icon: UsersIcon },
  { title: '设置', url: '/settings', icon: SettingsIcon },
]

function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const username = getUsername()

  function handleLogout() {
    clearAuth()
    navigate('/login', { replace: true })
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex h-14 items-center px-4 text-base font-semibold">
            管理后台
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>导航</SidebarGroupLabel>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    isActive={location.pathname === item.url}
                    render={<Link to={item.url} />}
                  >
                    <item.icon data-icon="inline-start" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex flex-col gap-2 px-4 pb-4">
            {username && (
              <p className="text-muted-foreground truncate text-xs">
                当前登录:{username}
            </p>
            )}
            <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
              退出登录
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default AdminLayout
