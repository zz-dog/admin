# 项目说明

后台管理前端（admin），尚未接入真实后端，接口通过 `/api` 前缀代理/预留。

## 技术栈

- **框架**: React 19 + TypeScript + Vite 8（包管理器用 bun）
- **路由**: react-router 8，路由集中在 `src/App.tsx`
- **样式**: Tailwind CSS 4（通过 `@tailwindcss/vite` 插件），UI 组件为 shadcn 风格，位于 `src/components/ui/`
- **表单**: react-hook-form + @hookform/resolvers（zod schema 校验）
- **React Compiler** 已启用（vite.config.ts 中 babel 插件），组件里不要手写 memo/useMemo 优化
- **Lint**: oxlint（不是 eslint）

## 常用命令

```bash
bun install        # 安装依赖
bun run dev        # 启动开发服务器（端口 8081）
bun run build      # tsc -b && vite build
bun run lint       # oxlint
```

## 目录结构

```
src/
  App.tsx            # 路由定义（唯一入口）
  main.tsx
  Login.tsx          # 登录页（注意：直接在 src/ 下，不在 pages/）
  Register.tsx       # 注册页（同上）
  components/
    AdminLayout.tsx  # 后台布局（侧边栏 + 顶栏）
    ProtectedRoute.tsx # 登录态守卫
    ui/              # shadcn 风格基础组件
  pages/             # 业务页面（Dashboard、Placeholder、NotFound）
  services/          # 按领域组织的 API 调用（如 auth.ts）
  lib/
    api.ts           # fetch 封装（BASE_URL、超时、ApiError）
    auth.ts          # localStorage 存取 token
    utils.ts         # cn() 等工具
  hooks/
```

## 关键约定

- **路径别名**: `@/` 指向 `src/`（import 一律用 `@/` 而不是相对路径）
- **API 调用**: 统一走 `src/lib/api.ts` 的 `api<T>()`，业务函数放 `src/services/`，按领域拆分文件；请求会自动带上 `Authorization: Bearer <token>`（取自 localStorage，未登录则不带）
- **后端响应结构**: `{ code, message, data }`，`code !== 0` 视为业务错误（见 `services/auth.ts` 的 `unwrap`）
- **API 地址**: 通过 `VITE_API_URL` 环境变量配置，默认 `/api`
- **登录态**: token 存 localStorage（key 为 `auth_token`），通过 `lib/auth.ts` 存取，不要直接操作 localStorage
- **401 处理**: 携带 token 的请求返回 HTTP 401 时，`lib/api.ts` 会自动清除登录态并跳转 `/login`（未登录时的 401 不跳转，按普通错误处理）
- **代码注释和 UI 文案使用中文**
