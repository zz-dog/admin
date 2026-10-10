import { useState } from "react";
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
import { Spinner } from "@/components/ui/spinner";
import type { Category } from "@/services/categories";

interface DeleteCategoryDialogProps {
  /** 待删除的分类,null 表示弹窗关闭 */
  category: Category | null;
  onOpenChange: (open: boolean) => void;
  /** 确认删除回调,抛错则在弹窗内展示错误 */
  onConfirm: (category: Category) => Promise<void>;
}

/** 删除分类确认弹窗,删除状态与错误反馈由弹窗自持 */
function DeleteCategoryDialog({
  category,
  onOpenChange,
  onConfirm,
}: DeleteCategoryDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    if (category === null) return;
    setDeleting(true);
    setError(null);
    try {
      await onConfirm(category);
      onOpenChange(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "删除失败,请稍后重试");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={category !== null}
      onOpenChange={(next) => {
        // 删除中不允许关闭
        if (!next && deleting) return;
        setError(null);
        onOpenChange(next);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>删除分类</AlertDialogTitle>
          <AlertDialogDescription>
            确定删除分类「{category?.name}」吗?此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-destructive text-sm">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={handleConfirm}
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
  );
}

export { DeleteCategoryDialog };
