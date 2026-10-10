import { useEffect, useRef, useState } from "react";
import { PlusIcon, XIcon } from "lucide-react";
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
import type { Spec } from "@/services/specs";

/** 表单提交给后端的值(规格值只提交名称,由后端整体替换) */
export interface SpecFormValues {
  name: string;
  values: { name: string }[];
}

/** 创建表单里规格值的草稿 */
interface SpecValueDraft {
  name: string;
}

function emptyValueDraft(): SpecValueDraft {
  return { name: "" };
}

interface SpecFormDialogProps {
  open: boolean;
  /** 编辑的规格,null 表示新建 */
  spec: Spec | null;
  /** 提交回调,抛错则展示错误,成功后自动关闭 */
  onSubmit: (values: SpecFormValues) => Promise<void>;
  onOpenChange: (open: boolean) => void;
}

/** 新建/编辑规格共用的表单弹窗,表单状态与提交反馈由弹窗自持 */
function SpecFormDialog({
  open,
  spec,
  onSubmit,
  onOpenChange,
}: SpecFormDialogProps) {
  const [name, setName] = useState("");
  const [values, setValues] = useState<SpecValueDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 记录最新初始值,打开弹窗时重置表单
  const specRef = useRef(spec);
  specRef.current = spec;

  useEffect(() => {
    if (!open) return;
    const value = specRef.current;
    setName(value?.name ?? "");
    setValues(
      value?.values?.length
        ? value.values.map((v) => ({ name: v.name }))
        : [emptyValueDraft()],
    );
    setError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请输入规格名称");
      return;
    }
    // 过滤未填写名称的规格值行
    const filledValues = values
      .filter((v) => v.name.trim())
      .map((v) => ({ name: v.name.trim() }));

    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name: trimmedName, values: filledValues });
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
          <DialogTitle>{spec ? "编辑规格" : "新建规格"}</DialogTitle>
          <DialogDescription>
            {spec
              ? `修改「${spec.name}」的信息,规格值以本次提交为准。`
              : "填写规格信息后提交。"}
          </DialogDescription>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            规格名称
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="如:颜色、尺寸"
              disabled={saving}
              required
            />
          </label>
          <div className="flex flex-col gap-2 text-sm font-medium">
            <span>规格值(可选,一并提交)</span>
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
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="移除该规格值"
                    disabled={saving}
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
                disabled={saving}
                onClick={() => setValues([...values, emptyValueDraft()])}
              >
                <PlusIcon data-icon="inline-start" />
                添加规格值
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (spec ? "保存中…" : "创建中…") : spec ? "保存修改" : "创建规格"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { SpecFormDialog };
