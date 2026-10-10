import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { PaginationProps } from "./type";

/** 简单分页:上一页 / 页码 / 下一页,配合同风格的 Table 使用 */
function Pagination({
  page,
  pageSize,
  total,
  onChange,
  disabled = false,
  totalText,
  className,
}: PaginationProps) {
  // 没有数据时不渲染,避免占位
  if (total <= 0) return null;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className={cn("flex items-center justify-between text-sm", className)}>
      <span className="text-muted-foreground">
        {totalText ? totalText(total) : `共 ${total} 条`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={() => onChange(page - 1)}
        >
          上一页
        </Button>
        <span>
          第 {page} / {totalPages} 页
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}

export { Pagination };
