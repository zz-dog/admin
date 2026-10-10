import { useCallback, useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createCategory,
  deleteCategory,
  findAllCategories,
  updateCategory,
  type Category,
} from "@/services/categories";

import { CategoryFormDialog, type CategoryFormValues } from "./components/CategoryFormDialog";
import { CategoryTable } from "./components/CategoryTable";
import { DeleteCategoryDialog } from "./components/DeleteCategoryDialog";
import { SpecBindPanel } from "./components/SpecBindPanel";
import { buildRows, findSelfAndDescendantIds, type CategoryRow } from "./components/utils";

function ProductCategoryPage() {
  const [rows, setRows] = useState<CategoryRow[] | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // 弹窗/面板状态(表单细节由各组件自持)
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  // 非空时展示该分类的规格绑定面板
  const [specCategoryId, setSpecCategoryId] = useState<number | null>(null);

  const loadCategories = useCallback((signal?: AbortSignal) => {
    setListLoading(true);
    setListError(null);
    findAllCategories()
      .then((list) => {
        if (signal?.aborted) return;
        setRows(buildRows(list ?? []));
      })
      .catch((e) => {
        if (signal?.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setRows([]);
        setListError(e instanceof Error ? e.message : "加载失败,请稍后重试");
      })
      .finally(() => {
        if (!signal?.aborted) {
          setListLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadCategories(controller.signal);
    return () => controller.abort();
  }, [loadCategories]);

  const byId = new Map(
    (rows ?? []).map((row) => [row.category.categoryId, row.category]),
  );
  const specCategory =
    specCategoryId !== null ? byId.get(specCategoryId) : undefined;

  // 编辑时父级不能选自己或后代
  const editExcludedIds =
    editingCategory && rows
      ? findSelfAndDescendantIds(rows, editingCategory.categoryId)
      : null;

  async function handleCreate(values: CategoryFormValues) {
    // 后端创建接口仍要求 sort 字段,统一传 0
    await createCategory({ ...values, sort: 0 });
    loadCategories();
  }

  async function handleUpdate(values: CategoryFormValues) {
    if (editingCategory === null) return;
    await updateCategory(editingCategory.categoryId, values);
    loadCategories();
  }

  async function handleDelete(category: Category) {
    await deleteCategory(category.categoryId);
    // 被删分类的规格面板同时关闭
    if (specCategoryId === category.categoryId) {
      setSpecCategoryId(null);
    }
    loadCategories();
  }

  /** 点击「管理规格」:再点一次收起面板 */
  function toggleSpecs(category: Category) {
    setSpecCategoryId((current) =>
      current === category.categoryId ? null : category.categoryId,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">产品分类</h1>
          <p className="text-muted-foreground text-sm">
            查看和管理产品分类层级与规格绑定。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新建分类
        </Button>
      </div>

      <CategoryTable
        rows={rows ?? []}
        loading={listLoading}
        error={listError}
        onRetry={() => loadCategories()}
        activeSpecCategoryId={specCategoryId}
        specLoading={false}
        onEdit={setEditingCategory}
        onToggleSpecs={toggleSpecs}
        onDelete={setDeletingCategory}
      />

      {/* 展开某分类的规格绑定面板 */}
      {specCategory && (
        <SpecBindPanel
          key={specCategory.categoryId}
          category={specCategory}
        />
      )}

      {/* 新建分类弹窗 */}
      <CategoryFormDialog
        open={createOpen}
        title="新建分类"
        description="填写分类信息后提交。"
        categories={rows}
        initialValues={{ name: "", parentId: null }}
        submitText="创建分类"
        submittingText="创建中…"
        onSubmit={handleCreate}
        onOpenChange={setCreateOpen}
      />

      {/* 编辑分类弹窗 */}
      <CategoryFormDialog
        open={editingCategory !== null}
        title="编辑分类"
        description={`修改「${editingCategory?.name}」的信息,未改动的字段保持原值。`}
        categories={rows}
        excludedIds={editExcludedIds}
        initialValues={
          editingCategory ?? { name: "", parentId: null }
        }
        submitText="保存修改"
        submittingText="保存中…"
        onSubmit={handleUpdate}
        onOpenChange={(open) => {
          if (!open) setEditingCategory(null);
        }}
      />

      {/* 删除分类确认弹窗 */}
      <DeleteCategoryDialog
        category={deletingCategory}
        onOpenChange={(open) => {
          if (!open) setDeletingCategory(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default ProductCategoryPage;
