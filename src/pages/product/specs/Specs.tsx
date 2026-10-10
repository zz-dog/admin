import { useEffect, useState } from "react";

import { formatDate } from "@/utils";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";
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
import { Pagination, Table, type Column } from "@/components/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  createSpec,
  deleteSpec,
  listSpecs,
  updateSpec,
  type Spec,
} from "@/services/specs";

import {
  SpecFormDialog,
  type SpecFormValues,
} from "./components/SpecFormDialog";

const PAGE_SIZE = 10;

/** 查询条件(page 也在内,翻页/搜索都通过改它触发请求) */
interface SpecQuery {
  page: number;
  name: string;
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

  // 弹窗状态(表单细节由弹窗自持)
  const [formOpen, setFormOpen] = useState(false);
  const [editingSpec, setEditingSpec] = useState<Spec | null>(null);

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

  async function handleSubmit(values: SpecFormValues) {
    if (editingSpec) {
      await updateSpec(editingSpec.specId, values);
      // 编辑后刷新当前页
      setQuery({ ...query });
    } else {
      await createSpec(values);
      // 新建后回到第一页
      setQuery({ page: 1, name: query.name });
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

  const columns: Column<Spec>[] = [
    { key: "specId", title: "规格 ID" },
    { key: "name", title: "规格名称", className: "font-medium" },
    {
      key: "values",
      title: "规格值",
      render: (spec) =>
        spec.values?.length ? (
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
        ),
    },
    {
      key: "createdAt",
      title: "创建时间",
      nowrap: true,
      render: (spec) => {
        return <text>{formatDate(spec.createdAt)}</text>;
      },
    },
    {
      key: "actions",
      title: "操作",
      render: (spec) => (
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`编辑规格 ${spec.name}`}
            onClick={() => {
              setEditingSpec(spec);
              setFormOpen(true);
            }}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`删除规格 ${spec.name}`}
            onClick={() => setDeletingSpec(spec)}
          >
            <Trash2Icon className="text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">商品规格</h1>
          <p className="text-muted-foreground text-sm">
            管理规格维度(如颜色、尺寸)及其规格值。
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingSpec(null);
            setFormOpen(true);
          }}
        >
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
        <Button
          type="submit"
          disabled={loading}
        >
          <SearchIcon data-icon="inline-start" />
          搜索
        </Button>
      </form>

      {deleteError && <p className="text-destructive text-sm">{deleteError}</p>}

      <Table
        data={data?.list ?? []}
        columns={columns}
        rowKey="specId"
        loading={loading}
        error={error}
        onRetry={() => setQuery({ ...query })}
        emptyTitle="暂无规格"
        emptyDescription="没有找到符合条件的规格,可在下方创建。"
      />

      {data && data.list.length > 0 && (
        <Pagination
          page={query.page}
          pageSize={PAGE_SIZE}
          total={total}
          disabled={loading}
          onChange={(page) => setQuery({ ...query, page })}
        />
      )}

      {/* 新建/编辑规格弹窗 */}
      <SpecFormDialog
        open={formOpen}
        spec={editingSpec}
        onSubmit={handleSubmit}
        onOpenChange={setFormOpen}
      />

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
