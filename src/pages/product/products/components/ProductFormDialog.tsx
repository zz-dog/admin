import { useEffect, useRef, useState } from "react";
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
import { RichTextEditor } from "@/components/rich-text-editor";
import { Spinner } from "@/components/ui/spinner";
import type { Category } from "@/services/categories";
import {
  createProduct,
  updateProduct,
  type Product,
} from "@/services/products";
import type { Spec } from "@/services/specs";

import { SkuEditor } from "./SkuEditor";
import { emptySku, parseSkus, SELECT_CLASS, type SkuDraft } from "./utils";

interface ProductFormDialogProps {
  open: boolean;
  /** 编辑的商品,null 表示新建 */
  product: Product | null;
  categories: Category[];
  specs: Spec[];
  /** 保存成功后回调(用于刷新列表) */
  onSaved: () => void;
  onOpenChange: (open: boolean) => void;
}

/** 新建/编辑商品共用的表单弹窗,表单状态与提交反馈由弹窗自持 */
function ProductFormDialog({
  open,
  product,
  categories,
  specs,
  onSaved,
  onOpenChange,
}: ProductFormDialogProps) {
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [skus, setSkus] = useState<SkuDraft[]>([emptySku()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 记录最新初始值,打开弹窗时重置表单
  const productRef = useRef(product);
  productRef.current = product;

  useEffect(() => {
    if (!open) return;
    const value = productRef.current;
    setName(value?.name ?? "");
    setCategoryId(value ? String(value.categoryId) : "");
    setDescription(value?.desc ?? "");
    setSkus([emptySku()]);
    setError(null);
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedCategoryId = Number(categoryId);
    if (
      !trimmedName ||
      !Number.isInteger(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      setError("请填写商品名称并选择分类");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (product) {
        await updateProduct({
          productId: product.productId,
          name: trimmedName,
          categoryId: parsedCategoryId,
          desc: description.trim(),
        });
      } else {
        const parsedSkus = parseSkus(skus);
        if (!parsedSkus) {
          setError("请正确填写 SKU 的价格、库存和规格值");
          setSaving(false);
          return;
        }
        await createProduct({
          categoryId: parsedCategoryId,
          name: trimmedName,
          desc: description.trim(),
          skus: parsedSkus,
        });
      }
      onSaved();
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "保存失败,请稍后重试",
      );
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {product ? "编辑商品" : "新建商品"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "修改商品的基础信息。SKU 由创建接口维护。"
              : "填写商品基础信息并配置 SKU。"}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
        >
          <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">商品名称</span>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">商品分类</span>
              <select
                className={SELECT_CLASS}
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
              >
                <option value="">请选择分类</option>
                {categories.map((category) => (
                  <option
                    key={category.categoryId}
                    value={category.categoryId}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium">商品描述</span>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="请输入商品描述"
              />
            </div>

            {/* SKU 由创建接口维护,编辑时不展示 */}
            {!product && <SkuEditor skus={skus} onChange={setSkus} specs={specs} />}
          </div>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving && <Spinner data-icon="inline-start" />}
              {saving ? "保存中" : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { ProductFormDialog };
