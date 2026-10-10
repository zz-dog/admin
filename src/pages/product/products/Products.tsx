import { useEffect, useState, type FormEvent } from "react";
import { PlusIcon, SearchIcon } from "lucide-react";
import { Pagination } from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findAllCategories, type Category } from "@/services/categories";
import { listProducts, type Product } from "@/services/products";
import { listSpecs, type Spec } from "@/services/specs";

import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductTable } from "./components/ProductTable";
import { PAGE_SIZE } from "./components/utils";

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 搜索词单独存值,点搜索才生效
  const [nameInput, setNameInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");

  // 表单选项基础数据
  const [categories, setCategories] = useState<Category[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // 弹窗状态(表单细节由弹窗自持)
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      findAllCategories(),
      listSpecs({ page: 1, pageSize: 100, signal: controller.signal }),
    ])
      .then(([categoryList, specList]) => {
        if (controller.signal.aborted) return;
        setCategories(categoryList ?? []);
        setSpecs(specList.list ?? []);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setOptionsError(
            cause instanceof Error ? cause.message : "基础数据加载失败",
          );
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listProducts({
      page,
      pageSize: PAGE_SIZE,
      name: nameQuery || undefined,
      signal: controller.signal,
    })
      .then((result) => {
        if (controller.signal.aborted) return;
        setProducts(result.list ?? []);
        setTotal(result.total ?? 0);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "商品加载失败");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, nameQuery, reloadKey]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setNameQuery(nameInput.trim());
  }

  /** 保存成功后回到第一页并刷新列表 */
  function handleSaved() {
    setPage(1);
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">商品列表</h1>
          <p className="text-muted-foreground text-sm">
            管理商品信息和 SKU 库存。
          </p>
        </div>
        <Button
          onClick={() => setFormOpen(true)}
          disabled={optionsError !== null}
        >
          <PlusIcon data-icon="inline-start" />
          新建商品
        </Button>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={handleSearch}
      >
        <Input
          className="w-56"
          placeholder="商品名称"
          value={nameInput}
          onChange={(event) => setNameInput(event.target.value)}
        />
        <Button
          type="submit"
          disabled={loading}
        >
          <SearchIcon data-icon="inline-start" />
          搜索
        </Button>
      </form>

      {optionsError && (
        <p className="text-destructive text-sm">{optionsError}</p>
      )}

      <ProductTable
        products={products}
        categories={categories}
        loading={loading}
        error={error}
        onRetry={() => setReloadKey((value) => value + 1)}
        onEdit={(product) => {
          setEditingProduct(product);
          setFormOpen(true);
        }}
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        disabled={loading}
        totalText={(total) => `共 ${total} 件商品`}
        onChange={setPage}
      />

      {/* 新建/编辑商品弹窗 */}
      <ProductFormDialog
        open={formOpen}
        product={editingProduct}
        categories={categories}
        specs={specs}
        onSaved={handleSaved}
        onOpenChange={(open) => {
          if (!open) setEditingProduct(null);
          setFormOpen(open);
        }}
      />
    </div>
  );
}

export default ProductsPage;
