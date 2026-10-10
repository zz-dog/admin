import { PencilIcon } from "lucide-react";
import { Table, type Column } from "@/components/table";
import { Button } from "@/components/ui/button";
import type { Category } from "@/services/categories";
import type { Product } from "@/services/products";
import { formatDate } from "@/utils";

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEdit: (product: Product) => void;
}

/** 商品列表表格,基于封装的 Table 组件 */
function ProductTable({
  products,
  categories,
  loading,
  error,
  onRetry,
  onEdit,
}: ProductTableProps) {
  // 用于把 categoryId 翻译成分类名称
  const categoryName = new Map(
    categories.map((category) => [category.categoryId, category.name]),
  );

  const columns: Column<Product>[] = [
    {
      key: "productId",
      title: "商品 ID",
      render: (product) => product.productId,
      nowrap: true,
    },
    {
      key: "name",
      title: "商品名称",
      render: (product) => <span className="font-medium">{product.name}</span>,
    },
    {
      key: "categoryId",
      title: "分类",
      render: (product) =>
        categoryName.get(product.categoryId) ?? product.categoryId,
    },
    {
      key: "skus",
      title: "SKU",
      render: (product) => product.skus?.length ?? 0,
    },
    {
      key: "status",
      title: "状态",
      render: (product) => (product.status === 1 ? "上架" : "下架"),
    },
    {
      key: "updatedAt",
      title: "更新时间",
      render: (product) => formatDate(product.updatedAt),
      nowrap: true,
    },
    {
      key: "action",
      title: "操作",
      render: (product) => (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`编辑商品 ${product.name}`}
          onClick={() => onEdit(product)}
        >
          <PencilIcon />
        </Button>
      ),
    },
  ];

  return (
    <Table
      data={products}
      columns={columns}
      rowKey="productId"
      loading={loading}
      error={error}
      onRetry={onRetry}
      emptyTitle="暂无商品"
      emptyDescription="没有找到符合条件的商品。"
    />
  );
}

export { ProductTable };
