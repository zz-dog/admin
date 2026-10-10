import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { SELECT_CLASS, type CategoryRow } from "./utils";

/** 表单提交给后端的值 */
export interface CategoryFormValues {
  name: string;
  parentId: number | null;
}

/** 打开时的初始表单值 */
export interface CategoryFormInitialValues {
  name: string;
  parentId: number | null;
}

interface CategoryFormDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  /** 父级分类选项(树形展开的行) */
  categories: CategoryRow[] | null;
  /** 禁止选择的分类 ID(编辑时为自身及后代,避免成环) */
  excludedIds?: Set<number> | null;
  initialValues: CategoryFormInitialValues;
  submitText: string;
  submittingText: string;
  /** 提交回调,抛错则展示错误,成功后自动关闭 */
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

/** 新建/编辑分类共用的表单弹窗,表单状态与提交反馈由弹窗自持 */
function CategoryFormDialog({
  open,
  title,
  description,
  categories,
  excludedIds = null,
  initialValues,
  submitText,
  submittingText,
  onSubmit,
  onOpenChange,
}: CategoryFormDialogProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 记录最新初始值,打开弹窗时重置表单
  const initialValuesRef = useRef(initialValues);
  initialValuesRef.current = initialValues;

  useEffect(() => {
    if (!open) return;
    const value = initialValuesRef.current;
    setName(value.name);
    setParentId(value.parentId === null ? "" : String(value.parentId));
    setError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedParentId = parentId ? Number(parentId) : null;

    if (!trimmedName) {
      setError("请输入分类名称");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        name: trimmedName,
        parentId: parsedParentId,
      });
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "提交失败,请稍后重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // 保存中不允许关闭
        if (!next && saving) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleSubmit}
        >
          <label className="flex flex-col gap-2 text-sm font-medium">
            分类名称
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="请输入分类名称"
              disabled={saving}
              required
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            父级分类
            <select
              className={`${SELECT_CLASS} w-full`}
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
              disabled={saving}
            >
              <option value="">无(顶级分类)</option>
              {categories
                ?.filter(
                  (row) => !excludedIds?.has(row.category.categoryId),
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? submittingText : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { CategoryFormDialog };
