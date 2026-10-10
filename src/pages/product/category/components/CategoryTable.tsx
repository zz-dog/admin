import { PencilIcon, TagsIcon, Trash2Icon } from "lucide-react";
import { Table, type Column } from "@/components/table";
import { Button } from "@/components/ui/button";
import type { Category } from "@/services/categories";
import { formatDate } from "@/utils";
import { type CategoryRow } from "./utils";

interface CategoryTableProps {
  /** 树形展开后的行(含层级深度) */
  rows: CategoryRow[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  /** 当前展开规格面板的分类 ID,null 表示未展开 */
  activeSpecCategoryId: number | null;
  /** 规格面板加载中(期间禁用「管理规格」按钮) */
  specLoading: boolean;
  onEdit: (category: Category) => void;
  onToggleSpecs: (category: Category) => void;
  onDelete: (category: Category) => void;
}

/** 分类树形表格,基于封装的 Table 组件,通过缩进展示层级 */
function CategoryTable({
  rows,
  loading,
  error,
  onRetry,
  activeSpecCategoryId,
  specLoading,
  onEdit,
  onToggleSpecs,
  onDelete,
}: CategoryTableProps) {
  // 用于把 parentId 翻译成父级分类名称
  const byId = new Map(
    rows.map((row) => [row.category.categoryId, row.category]),
  );

  const columns: Column<CategoryRow>[] = [
    {
      key: "name",
      title: "分类名称",
      render: ({ category, depth }) => (
        <span
          className="inline-block font-medium"
          style={{ marginLeft: `${depth * 1.5}rem` }}
        >
          {depth > 0 && <span className="text-muted-foreground mr-1">└</span>}
          {category.name}
        </span>
      ),
    },
    {
      key: "categoryId",
      title: "分类 ID",
      render: ({ category }) => category.categoryId,
      nowrap: true,
    },
    {
      key: "parentId",
      title: "父级分类",
      render: ({ category }) =>
        category.parentId !== null
          ? (byId.get(category.parentId)?.name ?? "-")
          : "-",
    },
    {
      key: "createdAt",
      title: "创建时间",
      render: ({ category }) => formatDate(category.createdAt),
      nowrap: true,
    },
    {
      key: "action",
      title: "操作",
      render: ({ category }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`编辑分类 ${category.name}`}
            onClick={() => onEdit(category)}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`管理分类 ${category.name} 的规格`}
            disabled={specLoading}
            onClick={() => onToggleSpecs(category)}
          >
            <TagsIcon
              className={
                activeSpecCategoryId === category.categoryId
                  ? "text-primary"
                  : undefined
              }
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`删除分类 ${category.name}`}
            onClick={() => onDelete(category)}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Table
      data={rows}
      columns={columns}
      rowKey={(row) => row.category.categoryId}
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="暂无分类"
      emptyDescription="还没有产品分类,可点击右上角创建第一个分类。"
    />
  );
}

export { CategoryTable };
