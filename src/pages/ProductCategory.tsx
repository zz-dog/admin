import { useCallback, useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, TagsIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  bindSpec,
  createCategory,
  deleteCategory,
  findAllCategories,
  findCategorySpecs,
  unbindSpec,
  updateCategory,
  type Category,
  type CategorySpec,
} from "@/services/categories";
import { listSpecs, type Spec } from "@/services/specs";

/** 树形表格里的一行(带层级深度) */
interface CategoryRow {
  category: Category;
  depth: number;
}

/** 把扁平列表按 parentId 组装成树并展开成行,每层按 sort 升序 */
function buildRows(categories: Category[]): CategoryRow[] {
  const ids = new Set(categories.map((c) => c.categoryId));
  const childrenMap = new Map<number, Category[]>();
  const roots: Category[] = [];
  for (const category of categories) {
    // 父级为空或指向不存在的分类时,当作顶级展示
    if (category.parentId === null || !ids.has(category.parentId)) {
      roots.push(category);
    } else {
      const siblings = childrenMap.get(category.parentId);
      if (siblings) {
        siblings.push(category);
      } else {
        childrenMap.set(category.parentId, [category]);
      }
    }
  }
  const sortByOrder = (a: Category, b: Category) =>
    a.sort - b.sort || a.categoryId - b.categoryId;

  const rows: CategoryRow[] = [];
  const visited = new Set<number>();
  function walk(list: Category[], depth: number) {
    for (const category of [...list].sort(sortByOrder)) {
      if (visited.has(category.categoryId)) continue; // 防御数据成环
      visited.add(category.categoryId);
      rows.push({ category, depth });
      walk(childrenMap.get(category.categoryId) ?? [], depth + 1);
    }
  }
  walk(roots, 0);
  return rows;
}

/** 找出某分类及其全部后代(编辑时禁止把父级设为这些分类,避免成环) */
function findSelfAndDescendantIds(
  rows: CategoryRow[],
  categoryId: number,
): Set<number> {
  const ids = new Set<number>([categoryId]);
  let started = false;
  let baseDepth = 0;
  for (const row of rows) {
    if (row.category.categoryId === categoryId) {
      started = true;
      baseDepth = row.depth;
      continue;
    }
    if (!started) continue;
    if (row.depth > baseDepth) {
      ids.add(row.category.categoryId);
    } else {
      break;
    }
  }
  return ids;
}

function formatValue(value: string | null | undefined) {
  return value || "-";
}

function ProductCategoryPage() {
  const [rows, setRows] = useState<CategoryRow[] | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // 创建分类弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [sort, setSort] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑弹窗
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [editSort, setEditSort] = useState("0");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 删除确认弹窗
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 规格绑定面板(specCategoryId 非空时展示)
  const [specCategoryId, setSpecCategoryId] = useState<number | null>(null);
  const [specRows, setSpecRows] = useState<CategorySpec[] | null>(null);
  const [specLoading, setSpecLoading] = useState(false);
  const [specError, setSpecError] = useState<string | null>(null);
  const [specOptions, setSpecOptions] = useState<Spec[]>([]);
  const specRequestIdRef = useRef(0);

  // 绑定表单
  const [bindSpecId, setBindSpecId] = useState("");
  const [bindRequired, setBindRequired] = useState(false);
  const [bindSort, setBindSort] = useState("0");
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // 解绑确认弹窗
  const [unbindingSpec, setUnbindingSpec] = useState<CategorySpec | null>(null);
  const [unbinding, setUnbinding] = useState(false);

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

  const boundSpecIds = new Set((specRows ?? []).map((s) => s.spec_id));
  const availableSpecs = specOptions.filter(
    (spec) => !boundSpecIds.has(spec.specId),
  );

  // 编辑时父级不能选自己或后代
  const editExcludedIds =
    editingCategory && rows
      ? findSelfAndDescendantIds(rows, editingCategory.categoryId)
      : null;

  function openEdit(category: Category) {
    setEditingCategory(category);
    setEditName(category.name);
    setEditParentId(
      category.parentId === null ? "" : String(category.parentId),
    );
    setEditSort(String(category.sort));
    setEditError(null);
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedParentId = parentId ? Number(parentId) : null;
    const parsedSort = Number(sort);

    if (!trimmedName) {
      setError("请输入分类名称");
      return;
    }
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      setError("排序必须是大于等于 0 的整数");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await createCategory({
        name: trimmedName,
        parentId: parsedParentId,
        sort: parsedSort,
      });
      setName("");
      setParentId("");
      setSort("0");
      setCreateOpen(false);
      loadCategories();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "创建失败,请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingCategory === null) return;
    const trimmedName = editName.trim();
    const parsedParentId = editParentId ? Number(editParentId) : null;
    const parsedSort = Number(editSort);

    if (!trimmedName) {
      setEditError("请输入分类名称");
      return;
    }
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      setEditError("排序必须是大于等于 0 的整数");
      return;
    }

    setEditSaving(true);
    setEditError(null);
    try {
      await updateCategory(editingCategory.categoryId, {
        name: trimmedName,
        parentId: parsedParentId,
        sort: parsedSort,
      });
      setEditingCategory(null);
      loadCategories();
    } catch (cause) {
      setEditError(
        cause instanceof Error ? cause.message : "更新失败,请稍后重试",
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete() {
    if (deletingCategory === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCategory(deletingCategory.categoryId);
      // 被删分类的规格面板同时关闭
      if (specCategoryId === deletingCategory.categoryId) {
        setSpecCategoryId(null);
      }
      setDeletingCategory(null);
      loadCategories();
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : "删除失败,请稍后重试",
      );
    } finally {
      setDeleting(false);
    }
  }

  function loadSpecs(categoryId: number) {
    const requestId = ++specRequestIdRef.current;
    setSpecLoading(true);
    setSpecError(null);
    Promise.all([
      findCategorySpecs(categoryId),
      listSpecs({ page: 1, pageSize: 100 }),
    ])
      .then(([bound, res]) => {
        if (specRequestIdRef.current !== requestId) return;
        setSpecRows(bound ?? []);
        setSpecOptions(res.list ?? []);
      })
      .catch((e) => {
        if (specRequestIdRef.current !== requestId) return;
        setSpecRows([]);
        setSpecError(e instanceof Error ? e.message : "加载失败,请稍后重试");
      })
      .finally(() => {
        if (specRequestIdRef.current !== requestId) return;
        setSpecLoading(false);
      });
  }

  function openSpecs(category: Category) {
    if (specCategoryId === category.categoryId) {
      setSpecCategoryId(null);
      return;
    }
    setSpecCategoryId(category.categoryId);
    setSpecRows(null);
    setSpecOptions([]);
    setBindSpecId("");
    setBindRequired(false);
    setBindSort("0");
    setBindError(null);
    loadSpecs(category.categoryId);
  }

  async function handleBind(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (specCategoryId === null) return;
    const parsedSpecId = bindSpecId ? Number(bindSpecId) : null;
    if (parsedSpecId === null) {
      setBindError("请选择要绑定的规格");
      return;
    }
    const parsedSort = Number(bindSort);
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      setBindError("排序必须是大于等于 0 的整数");
      return;
    }

    setBinding(true);
    setBindError(null);
    try {
      await bindSpec({
        categoryId: specCategoryId,
        specId: parsedSpecId,
        required: bindRequired,
        sort: parsedSort,
      });
      const bound = await findCategorySpecs(specCategoryId);
      setSpecRows(bound ?? []);
      setBindSpecId("");
      setBindRequired(false);
      setBindSort("0");
    } catch (cause) {
      setBindError(
        cause instanceof Error ? cause.message : "绑定失败,请稍后重试",
      );
    } finally {
      setBinding(false);
    }
  }

  async function handleUnbind() {
    if (specCategoryId === null || unbindingSpec === null) return;
    setUnbinding(true);
    setBindError(null);
    try {
      await unbindSpec(specCategoryId, unbindingSpec.spec_id);
      const bound = await findCategorySpecs(specCategoryId);
      setSpecRows(bound ?? []);
      setUnbindingSpec(null);
    } catch (cause) {
      setBindError(
        cause instanceof Error ? cause.message : "解绑失败,请稍后重试",
      );
    } finally {
      setUnbinding(false);
    }
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

      {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}

      {listError ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>加载失败</EmptyTitle>
            <EmptyDescription>{listError}</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => loadCategories()}
            disabled={listLoading}
          >
            重试
          </Button>
        </Empty>
      ) : listLoading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Spinner data-icon="inline-start" />
          加载中…
        </div>
      ) : rows && rows.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {[
                  "分类名称",
                  "分类 ID",
                  "父级分类",
                  "排序",
                  "创建时间",
                  "操作",
                ].map((title) => (
                  <th
                    key={title}
                    className="px-3 py-2.5 text-left font-medium"
                  >
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth }) => (
                <tr
                  key={category.categoryId}
                  className="border-t"
                >
                  <td
                    className="px-3 py-2.5 font-medium"
                    style={{ paddingLeft: `${depth * 1.5 + 0.75}rem` }}
                  >
                    {depth > 0 && (
                      <span className="text-muted-foreground mr-1">└</span>
                    )}
                    {category.name}
                  </td>
                  <td className="px-3 py-2.5">{category.categoryId}</td>
                  <td className="px-3 py-2.5">
                    {category.parentId !== null
                      ? (byId.get(category.parentId)?.name ?? "-")
                      : "-"}
                  </td>
                  <td className="px-3 py-2.5">{category.sort}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatValue(category.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`编辑分类 ${category.name}`}
                        onClick={() => openEdit(category)}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`管理分类 ${category.name} 的规格`}
                        disabled={specLoading}
                        onClick={() => openSpecs(category)}
                      >
                        <TagsIcon
                          className={
                            specCategoryId === category.categoryId
                              ? "text-primary"
                              : undefined
                          }
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`删除分类 ${category.name}`}
                        onClick={() => setDeletingCategory(category)}
                      >
                        <Trash2Icon className="text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无分类</EmptyTitle>
            <EmptyDescription>
              还没有产品分类,可在下方创建第一个分类。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {specCategoryId !== null && (
        <Card>
          <CardHeader>
            <CardTitle>
              「{specCategory?.name ?? specCategoryId}」的规格绑定
            </CardTitle>
            <CardDescription>
              管理该分类绑定的规格维度(如颜色、尺寸)。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {specError ? (
              <div className="flex items-center gap-3">
                <p className="text-destructive text-sm">{specError}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadSpecs(specCategoryId)}
                  disabled={specLoading}
                >
                  重试
                </Button>
              </div>
            ) : specLoading ? (
              <div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
                <Spinner data-icon="inline-start" />
                加载中…
              </div>
            ) : specRows && specRows.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      {["规格名称", "规格值", "是否必选", "排序", "操作"].map(
                        (title) => (
                          <th
                            key={title}
                            className="px-3 py-2.5 text-left font-medium"
                          >
                            {title}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {specRows.map((spec) => (
                      <tr
                        key={spec.spec_id}
                        className="border-t"
                      >
                        <td className="px-3 py-2.5 font-medium">
                          {spec.spec_name}
                        </td>
                        <td className="px-3 py-2.5">
                          {spec.values?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {spec.values.map((value) => (
                                <span
                                  key={value.value_id}
                                  className="bg-muted rounded border px-1.5 py-0.5 text-xs"
                                >
                                  {value.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {spec.required ? "必选" : "可选"}
                        </td>
                        <td className="px-3 py-2.5">{spec.sort}</td>
                        <td className="px-3 py-2.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={unbinding}
                            onClick={() => setUnbindingSpec(spec)}
                          >
                            解绑
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-sm">
                该分类还没有绑定规格,可在下方添加。
              </p>
            )}

            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={handleBind}
            >
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                规格
                <select
                  className="h-8 w-48 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                  value={bindSpecId}
                  onChange={(event) => setBindSpecId(event.target.value)}
                  disabled={binding || specLoading}
                >
                  <option value="">请选择规格</option>
                  {availableSpecs.map((spec) => (
                    <option
                      key={spec.specId}
                      value={spec.specId}
                    >
                      {spec.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                排序
                <Input
                  type="number"
                  min="0"
                  step="1"
                  className="w-24"
                  value={bindSort}
                  onChange={(event) => setBindSort(event.target.value)}
                  disabled={binding}
                />
              </label>
              <label className="flex items-center gap-2 pb-1.5 text-sm font-medium">
                <Checkbox
                  checked={bindRequired}
                  onCheckedChange={(checked) =>
                    setBindRequired(checked === true)
                  }
                  disabled={binding}
                />
                必选
              </label>
              <Button
                type="submit"
                disabled={binding || specLoading}
              >
                {binding ? "绑定中…" : "绑定规格"}
              </Button>
              {availableSpecs.length === 0 && !specLoading && (
                <p className="text-muted-foreground w-full text-xs">
                  没有可绑定的规格,可先到「商品规格」页面创建。
                </p>
              )}
            </form>
            {bindError && (
              <p className="text-destructive text-sm">{bindError}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* 创建分类弹窗 */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open && !loading) setCreateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
            <DialogDescription>填写分类信息后提交。</DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleCreate}
          >
            <label className="flex flex-col gap-2 text-sm font-medium">
              分类名称
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="请输入分类名称"
                disabled={loading}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              父级分类
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                disabled={loading}
              >
                <option value="">无(顶级分类)</option>
                {rows?.map(({ category, depth }) => (
                  <option
                    key={category.categoryId}
                    value={category.categoryId}
                  >
                    {"　".repeat(depth)}
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              排序
              <Input
                type="number"
                min="0"
                step="1"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                disabled={loading}
                required
              />
            </label>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "创建中…" : "创建分类"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 编辑分类弹窗 */}
      <Dialog
        open={editingCategory !== null}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditingCategory(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>
              修改「{editingCategory?.name}」的信息,未改动的字段保持原值。
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleUpdate}
          >
            <label className="flex flex-col gap-2 text-sm font-medium">
              分类名称
              <Input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                placeholder="请输入分类名称"
                disabled={editSaving}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              父级分类
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                value={editParentId}
                onChange={(event) => setEditParentId(event.target.value)}
                disabled={editSaving}
              >
                <option value="">无(顶级分类)</option>
                {rows
                  ?.filter(
                    (row) => !editExcludedIds?.has(row.category.categoryId),
                  )
                  .map(({ category, depth }) => (
                    <option
                      key={category.categoryId}
                      value={category.categoryId}
                    >
                      {"　".repeat(depth)}
                      {category.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              排序
              <Input
                type="number"
                min="0"
                step="1"
                value={editSort}
                onChange={(event) => setEditSort(event.target.value)}
                disabled={editSaving}
                required
              />
            </label>
            {editError && (
              <p className="text-destructive text-sm">{editError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingCategory(null)}
                disabled={editSaving}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={editSaving}
              >
                {editSaving ? "保存中…" : "保存修改"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 删除分类确认弹窗 */}
      <AlertDialog
        open={deletingCategory !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除分类</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除分类「{deletingCategory?.name}」吗?此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={handleDelete}
            >
              {deleting ? (
                <>
                  <Spinner data-icon="inline-start" />
                  删除中…
                </>
              ) : (
                "确认删除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 解绑规格确认弹窗 */}
      <AlertDialog
        open={unbindingSpec !== null}
        onOpenChange={(open) => {
          if (!open && !unbinding) setUnbindingSpec(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>解除规格绑定</AlertDialogTitle>
            <AlertDialogDescription>
              确定解除规格「{unbindingSpec?.spec_name}」与该分类的绑定吗?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unbinding}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={unbinding}
              onClick={handleUnbind}
            >
              {unbinding ? "解绑中…" : "确认解绑"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ProductCategoryPage;
