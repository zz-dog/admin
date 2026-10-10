import { useEffect, useRef, useState } from "react";
import { Table, type Column } from "@/components/table";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  bindSpec,
  findCategorySpecs,
  unbindSpec,
  type Category,
  type CategorySpec,
} from "@/services/categories";
import { listSpecs, type Spec } from "@/services/specs";

import { SELECT_CLASS } from "./utils";

interface SpecBindPanelProps {
  /** 要管理规格绑定的分类 */
  category: Category;
}

/** 分类规格绑定面板:展示已绑定规格、绑定新规格、解绑 */
function SpecBindPanel({ category }: SpecBindPanelProps) {
  const categoryId = category.categoryId;
  const [specRows, setSpecRows] = useState<CategorySpec[] | null>(null);
  const [specOptions, setSpecOptions] = useState<Spec[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 绑定表单
  const [bindSpecId, setBindSpecId] = useState("");
  const [bindRequired, setBindRequired] = useState(false);
  const [binding, setBinding] = useState(false);
  const [bindError, setBindError] = useState<string | null>(null);

  // 解绑确认弹窗
  const [unbindingSpec, setUnbindingSpec] = useState<CategorySpec | null>(null);
  const [unbinding, setUnbinding] = useState(false);

  // 用请求序号丢弃过期响应(快速切换分类时)
  const requestIdRef = useRef(0);

  function loadSpecs(id: number) {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    Promise.all([
      findCategorySpecs(id),
      listSpecs({ page: 1, pageSize: 100 }),
    ])
      .then(([bound, res]) => {
        if (requestIdRef.current !== requestId) return;
        setSpecRows(bound ?? []);
        setSpecOptions(res.list ?? []);
      })
      .catch((e) => {
        if (requestIdRef.current !== requestId) return;
        setSpecRows([]);
        setError(e instanceof Error ? e.message : "加载失败,请稍后重试");
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }

  useEffect(() => {
    loadSpecs(categoryId);
    // 切换分类时重新加载
    return () => {
      requestIdRef.current += 1;
    };
  }, [categoryId]);

  const boundSpecIds = new Set((specRows ?? []).map((s) => s.spec_id));
  const availableSpecs = specOptions.filter(
    (spec) => !boundSpecIds.has(spec.specId),
  );

  async function handleBind(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedSpecId = bindSpecId ? Number(bindSpecId) : null;
    if (parsedSpecId === null) {
      setBindError("请选择要绑定的规格");
      return;
    }

    setBinding(true);
    setBindError(null);
    try {
      // 后端绑定接口仍要求 sort 字段,统一传 0
      await bindSpec({
        categoryId,
        specId: parsedSpecId,
        required: bindRequired,
        sort: 0,
      });
      const bound = await findCategorySpecs(categoryId);
      setSpecRows(bound ?? []);
      setBindSpecId("");
      setBindRequired(false);
    } catch (cause) {
      setBindError(
        cause instanceof Error ? cause.message : "绑定失败,请稍后重试",
      );
    } finally {
      setBinding(false);
    }
  }

  async function handleUnbind() {
    if (unbindingSpec === null) return;
    setUnbinding(true);
    setBindError(null);
    try {
      await unbindSpec(categoryId, unbindingSpec.spec_id);
      const bound = await findCategorySpecs(categoryId);
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

  const columns: Column<CategorySpec>[] = [
    {
      key: "spec_name",
      title: "规格名称",
      render: (spec) => <span className="font-medium">{spec.spec_name}</span>,
    },
    {
      key: "values",
      title: "规格值",
      render: (spec) =>
        spec.values?.length ? (
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
        ),
    },
    {
      key: "required",
      title: "是否必选",
      render: (spec) => (spec.required ? "必选" : "可选"),
    },
    {
      key: "action",
      title: "操作",
      render: (spec) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={unbinding}
          onClick={() => setUnbindingSpec(spec)}
        >
          解绑
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>「{category.name}」的规格绑定</CardTitle>
        <CardDescription>
          管理该分类绑定的规格维度(如颜色、尺寸)。
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Table
          data={specRows ?? []}
          columns={columns}
          rowKey="spec_id"
          loading={loading}
          error={error}
          onRetry={() => loadSpecs(categoryId)}
          emptyTitle="该分类还没有绑定规格"
          emptyDescription="可在下方选择规格进行绑定。"
        />

        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={handleBind}
        >
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            规格
            <select
              className={`${SELECT_CLASS} w-48`}
              value={bindSpecId}
              onChange={(event) => setBindSpecId(event.target.value)}
              disabled={binding || loading}
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
            disabled={binding || loading}
          >
            {binding ? "绑定中…" : "绑定规格"}
          </Button>
          {availableSpecs.length === 0 && !loading && (
            <p className="text-muted-foreground w-full text-xs">
              没有可绑定的规格,可先到「商品规格」页面创建。
            </p>
          )}
        </form>
        {bindError && (
          <p className="text-destructive text-sm">{bindError}</p>
        )}
      </CardContent>

      {/* 解绑规格确认弹窗 */}
      <AlertDialog
        open={unbindingSpec !== null}
        onOpenChange={(open) => {
          // 解绑中不允许关闭
          if (!open && unbinding) return;
          setUnbindingSpec(null);
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
    </Card>
  );
}

export { SpecBindPanel };
