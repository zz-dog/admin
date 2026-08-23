import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NAV_ITEMS, type NavItem } from "@/config/navigation";
import { clearAuth, getUsername } from "@/lib/auth";

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const username = getUsername();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  function hasActiveChild(item: NavItem): boolean {
    return (
      item.children?.some(
        (child) => location.pathname === child.url || hasActiveChild(child),
      ) ?? false
    );
  }

  function toggleItem(url: string) {
    setExpandedItems((items) => ({ ...items, [url]: !items[url] }));
  }

  function renderNavItem(item: NavItem, nested = false) {
    const hasChildren = Boolean(item.children?.length);
    const isExpanded = expandedItems[item.url] ?? hasActiveChild(item);
    const isActive = location.pathname === item.url;
    const MenuButton = nested ? SidebarMenuSubButton : SidebarMenuButton;
    const MenuItem = nested ? SidebarMenuSubItem : SidebarMenuItem;

    return (
      <MenuItem key={item.url}>
        {hasChildren ? (
          <MenuButton
            isActive={isActive || hasActiveChild(item)}
            onClick={() => toggleItem(item.url)}
            aria-expanded={isExpanded}
          >
            <item.icon data-icon="inline-start" />
            <span>{item.title}</span>
            <ChevronRightIcon
              className={`ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}
              data-icon="inline-end"
            />
          </MenuButton>
        ) : (
          <MenuButton
            isActive={isActive}
            render={<Link to={item.url} />}
          >
            <item.icon data-icon="inline-start" />
            <span>{item.title}</span>
          </MenuButton>
        )}
        {hasChildren && isExpanded && (
          <SidebarMenuSub>
            {item.children?.map((child) => renderNavItem(child, true))}
          </SidebarMenuSub>
        )}
      </MenuItem>
    );
  }

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
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
              {NAV_ITEMS.map((item) => renderNavItem(item))}
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
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="h-4"
          />
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default AdminLayout;
