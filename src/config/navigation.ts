import {
  BadgeIcon,
  ListIcon,
  LayoutDashboardIcon,
  PackageIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  children?: NavItem[];
};

export const NAV_ITEMS: NavItem[] = [
  { title: "仪表盘", url: "/", icon: LayoutDashboardIcon },
  { title: "用户管理", url: "/users", icon: UsersIcon },
  { title: "设置", url: "/settings", icon: SettingsIcon },
  {
    title: "商品管理",
    url: "/product",
    icon: PackageIcon,
    children: [
      { title: "商品列表", url: "/product/list", icon: ListIcon },
      { title: "商品分类", url: "/product/category", icon: TagsIcon },
      { title: "商品规格", url: "/product/spec", icon: SlidersHorizontalIcon },
      { title: "商品品牌", url: "/product/brand", icon: BadgeIcon },
    ],
  },
];
