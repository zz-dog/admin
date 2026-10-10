import type { ReactNode } from "react"

/** 单元格渲染函数:入参为行数据和行索引(含表头行) */
export type CellRender<T> = (row: T, index: number) => ReactNode

/** 行 key:取字段名或由函数生成 */
export type RowKey<T> =
  | (keyof T & (string | number))
  | ((row: T, index: number) => string | number)

export interface Column<T> {
  /** 列标识,同时作为表头单元格的 key,需在列内唯一 */
  key: string
  /** 表头文案 */
  title: ReactNode
  /**
   * 自定义单元格渲染;缺省时直接展示 row[key] 字段的值
   */
  render?: CellRender<T>
  /** 附加到表头与单元格的 class(如 w-24、font-medium) */
  className?: string
  /** 文本对齐方式,默认 left */
  align?: "left" | "center" | "right"
  /** 是否禁止换行(适合时间、ID 等短内容列) */
  nowrap?: boolean
}

export interface TableProps<T> {
  /** 行数据列表 */
  data: T[]
  /** 列配置,顺序即展示顺序 */
  columns: Column<T>[]
  /** 行 key,用于 React 列表渲染 */
  rowKey: RowKey<T>
  /** 是否加载中,加载时保留表头并在表体展示加载动画 */
  loading?: boolean
  /** 加载失败文案,非空时展示错误态;配合 onRetry 展示重试按钮 */
  error?: string | null
  /** 点击「重试」按钮时触发 */
  onRetry?: () => void
  /** 空数据标题,默认「暂无数据」 */
  emptyTitle?: string
  /** 空数据描述文案 */
  emptyDescription?: string
  /** 点击某一行时触发 */
  onRowClick?: (row: T, index: number) => void
  /** 附加到最外层容器的 class */
  className?: string
}

/** 分页组件属性 */
export interface PaginationProps {
  /** 当前页码,从 1 开始 */
  page: number
  /** 每页条数 */
  pageSize: number
  /** 数据总条数,为 0 时不渲染 */
  total: number
  /** 翻页回调,入参为目标页码 */
  onChange: (page: number) => void
  /** 是否禁用翻页按钮(如列表加载中) */
  disabled?: boolean
  /** 自定义左侧统计文案,入参为总条数 */
  totalText?: (total: number) => string
  /** 附加到最外层容器的 class */
  className?: string
}
