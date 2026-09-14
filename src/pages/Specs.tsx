import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
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
import { createSpec, deleteSpec, listSpecs, type Spec } from "@/services/specs";

const PAGE_SIZE = 10;

/** 查询条件(page 也在内,翻页/搜索都通过改它触发请求) */
interface SpecQuery {
  page: number;
  name: string;
}

function formatValue(value: string | null | undefined) {
  return value || "-";
}

/** 创建表单里规格值的草稿 */
interface SpecValueDraft {
  name: string;
  sort: string;
}

function emptyValueDraft(): SpecValueDraft {
  return { name: "", sort: "0" };
}

function SpecsPage() {
  const [query, setQuery] = useState<SpecQuery>({ page: 1, name: "" });
  // 输入框单独存值,点搜索才生效
  const [nameInput, setNameInput] = useState("");
  const [data, setData] = useState<{ list: Spec[]; total: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 创建弹窗
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [sort, setSort] = useState("0");
  const [values, setValues] = useState<SpecValueDraft[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [deletingSpec, setDeletingSpec] = useState<Spec | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    listSpecs({
      page: query.page,
      pageSize: PAGE_SIZE,
      name: query.name || undefined,
      signal: controller.signal,
    })
      .then((res) => {
        setData({ list: res.list ?? [], total: res.total });
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "加载失败,请稍后重试");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [query]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery({ page: 1, name: nameInput.trim() });
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedSort = Number(sort);
    if (!trimmedName) {
      setCreateError("请输入规格名称");
      return;
    }
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      setCreateError("排序必须是大于等于 0 的整数");
      return;
    }
    // 过滤未填写名称的规格值行,并校验排序
    const filledValues = values.filter((v) => v.name.trim());
    for (const value of filledValues) {
      const valueSort = Number(value.sort);
      if (!Number.isInteger(valueSort) || valueSort < 0) {
        setCreateError(
          `规格值「${value.name.trim()}」的排序必须是大于等于 0 的整数`,
        );
        return;
      }
    }

    setCreating(true);
    setCreateError(null);
    try {
      await createSpec({
        name: trimmedName,
        sort: parsedSort,
        values: filledValues.map((v) => ({
          name: v.name.trim(),
          sort: Number(v.sort),
        })),
      });
      setName("");
      setSort("0");
      setValues([]);
      setCreateOpen(false);
      setQuery({ page: 1, name: query.name });
    } catch (cause) {
      setCreateError(
        cause instanceof Error ? cause.message : "创建失败,请稍后重试",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (deletingSpec === null) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteSpec(deletingSpec.specId);
      setDeletingSpec(null);
      // 当前页删空后往前翻一页
      const remaining = (data?.list.length ?? 0) - 1;
      const page =
        remaining === 0 && query.page > 1 ? query.page - 1 : query.page;
      setQuery({ ...query, page });
    } catch (cause) {
      setDeleteError(
        cause instanceof Error ? cause.message : "删除失败,请稍后重试",
      );
    } finally {
      setDeleting(false);
    }
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">商品规格</h1>
          <p className="text-muted-foreground text-sm">
            管理规格维度(如颜色、尺寸)及其规格值。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          新建规格
        </Button>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={handleSearch}
      >
        <Input
          type="text"
          className="w-44"
          placeholder="规格名称"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          <SearchIcon data-icon="inline-start" />
          搜索
        </Button>
      </form>

      {deleteError && (
        <p className="text-destructive text-sm">{deleteError}</p>
      )}

      {error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>加载失败</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => setQuery({ ...query })}
            disabled={loading}
          >
            重试
          </Button>
        </Empty>
      ) : loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Spinner data-icon="inline-start" />
          加载中…
        </div>
      ) : data && data.list.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {["规格 ID", "规格名称", "规格值", "排序", "创建时间", "操作"].map(
                  (title) => (
                    <th key={title} className="px-3 py-2.5 text-left font-medium">
                      {title}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.list.map((spec) => (
                <tr key={spec.specId} className="border-t">
                  <td className="px-3 py-2.5">{spec.specId}</td>
                  <td className="px-3 py-2.5 font-medium">{spec.name}</td>
                  <td className="px-3 py-2.5">
                    {spec.values?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {spec.values.map((value) => (
                          <span
                            key={value.specValueId}
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
                  <td className="px-3 py-2.5">{spec.sort}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatValue(spec.createdAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`删除规格 ${spec.name}`}
                      onClick={() => setDeletingSpec(spec)}
                    >
                      <Trash2Icon className="text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>暂无规格</EmptyTitle>
            <EmptyDescription>
              没有找到符合条件的规格,可在下方创建。
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {data && data.list.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            共 {total} 条 · 第 {query.page} / {totalPages} 页
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="上一页"
              disabled={query.page <= 1 || loading}
              onClick={() => setQuery({ ...query, page: query.page - 1 })}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="下一页"
              disabled={query.page >= totalPages || loading}
              onClick={() => setQuery({ ...query, page: query.page + 1 })}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}

      {/* 创建规格弹窗 */}
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          if (!open && !creating) setCreateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建规格</DialogTitle>
            <DialogDescription>填写规格信息后提交。</DialogDescription>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleCreate}>
            <label className="flex flex-col gap-2 text-sm font-medium">
              规格名称
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="如:颜色、尺寸"
                disabled={creating}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              排序
              <Input
                type="number"
                min="0"
                step="1"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                disabled={creating}
                required
              />
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium">
              <span>规格值(可选,创建时一并录入)</span>
              <div className="flex flex-col gap-2">
                {values.map((value, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      className="flex-1"
                      placeholder="如:红色、XL"
                      value={value.name}
                      onChange={(event) => {
                        const next = [...values];
                        next[index] = { ...value, name: event.target.value };
                        setValues(next);
                      }}
                      disabled={creating}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      className="w-24"
                      aria-label={`规格值 ${value.name || index + 1} 的排序`}
                      value={value.sort}
                      onChange={(event) => {
                        const next = [...values];
                        next[index] = { ...value, sort: event.target.value };
                        setValues(next);
                      }}
                      disabled={creating}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label="移除该规格值"
                      disabled={creating}
                      onClick={() =>
                        setValues(values.filter((_, i) => i !== index))
                      }
                    >
                      <XIcon className="text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="self-start"
                  disabled={creating}
                  onClick={() => setValues([...values, emptyValueDraft()])}
                >
                  <PlusIcon data-icon="inline-start" />
                  添加规格值
                </Button>
              </div>
            </div>
            {createError && (
              <p className="text-destructive text-sm">{createError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={creating}
              >
                取消
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? "创建中…" : "创建规格"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* 删除规格确认弹窗 */}
      <AlertDialog
        open={deletingSpec !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingSpec(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除规格</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除规格「{deletingSpec?.name}」吗?此操作不可撤销。
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
    </div>
  );
}

export default SpecsPage;
