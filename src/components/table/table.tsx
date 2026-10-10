import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { Column, RowKey, TableProps } from "./type";

/** 对齐方式对应的 class */
const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

/** 计算行 key:字段名直接取值,函数则调用 */
function getRowKey<T>(row: T, index: number, rowKey: RowKey<T>): string {
  if (typeof rowKey === "function") {
    return String(rowKey(row, index));
  }
  return String(row[rowKey]);
}

/** 默认单元格内容:直接展示 row[key] 字段的值 */
function defaultCell<T>(row: T, column: Column<T>): ReactNode {
  const value = (row as Record<string, unknown>)[column.key];
  if (value == null || value === "") {
    return "-";
  }
  return String(value);
}

function Table<T>(props: TableProps<T>) {
  const {
    data,
    columns,
    rowKey,
    loading = false,
    error = null,
    onRetry,
    emptyTitle = "暂无数据",
    emptyDescription,
    onRowClick,
    className,
  } = props;

  // 加载失败:整表替换为错误占位
  if (error) {
    return (
      <Empty className={className}>
        <EmptyHeader>
          <EmptyTitle>加载失败</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} disabled={loading}>
            重试
          </Button>
        )}
      </Empty>
    );
  }

  const colCount = columns.length;

  return (
    <div className={cn("overflow-x-auto rounded-lg border", className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "px-3 py-2.5 font-medium",
                  ALIGN_CLASS[column.align ?? "left"],
                  column.nowrap && "whitespace-nowrap",
                  column.className,
                )}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 加载中:保留表头,表体展示加载动画 */}
          {loading ? (
            <tr>
              <td colSpan={colCount} className="px-3 py-12">
                <div className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
                  <Spinner data-icon="inline-start" />
                  加载中…
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="p-6">
                <Empty className="py-8">
                  <EmptyHeader>
                    <EmptyTitle>{emptyTitle}</EmptyTitle>
                    {emptyDescription && (
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    )}
                  </EmptyHeader>
                </Empty>
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = getRowKey(row, index, rowKey);
              return (
                <tr
                  key={key}
                  className={cn("border-t", onRowClick && "cursor-pointer")}
                  onClick={
                    onRowClick ? () => onRowClick(row, index) : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        "px-3 py-2.5",
                        ALIGN_CLASS[column.align ?? "left"],
                        column.nowrap && "whitespace-nowrap",
                        column.className,
                      )}
                    >
                      {column.render
                        ? column.render(row, index)
                        : defaultCell(row, column)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export { Table };
