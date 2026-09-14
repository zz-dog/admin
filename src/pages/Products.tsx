import { useEffect, useState, type FormEvent } from "react";
import { PencilIcon, PlusIcon, SearchIcon, XIcon } from "lucide-react";
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
import { findAllCategories, type Category } from "@/services/categories";
import { listSpecs, type Spec } from "@/services/specs";
import {
  createProduct,
  listProducts,
  updateProduct,
  type Product,
  type ProductSkuInput,
} from "@/services/products";

const PAGE_SIZE = 10;

type SkuDraft = {
  price: string;
  stock: string;
  specItems: { specId: string; valueId: string }[];
};

function emptySku(): SkuDraft {
  return { price: "0", stock: "0", specItems: [{ specId: "", valueId: "" }] };
}

function formatDate(value: string) {
  return value ? new Date(value).toLocaleString("zh-CN") : "-";
}

function ProductFormFields({
  name,
  setName,
  categoryId,
  setCategoryId,
  description,
  setDescription,
  categories,
  skus,
  setSkus,
  showSkus,
  specs,
}: {
  name: string;
  setName: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  categories: Category[];
  skus: SkuDraft[];
  setSkus: (value: SkuDraft[]) => void;
  showSkus: boolean;
  specs: Spec[];
}) {
  function updateSku(index: number, patch: Partial<SkuDraft>) {
    setSkus(
      skus.map((sku, skuIndex) =>
        skuIndex === index ? { ...sku, ...patch } : sku,
      ),
    );
  }

  function updateSpecItem(
    skuIndex: number,
    itemIndex: number,
    patch: Partial<SkuDraft["specItems"][number]>,
  ) {
    setSkus(
      skus.map((sku, currentSkuIndex) => {
        if (currentSkuIndex !== skuIndex) return sku;
        return {
          ...sku,
          specItems: sku.specItems.map((item, currentItemIndex) =>
            currentItemIndex === itemIndex ? { ...item, ...patch } : item,
          ),
        };
      }),
    );
  }

  return (
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
          className="border-input bg-background h-9 rounded-md border px-3 text-sm"
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
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium">商品描述</span>
        <textarea
          className="border-input bg-background min-h-20 rounded-md border px-3 py-2 text-sm outline-none"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      {showSkus && (
        <div className="flex flex-col gap-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">SKU 规格</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSkus([...skus, emptySku()])}
            >
              <PlusIcon data-icon="inline-start" />
              添加 SKU
            </Button>
          </div>
          {skus.map((sku, skuIndex) => (
            <div
              key={skuIndex}
              className="bg-muted/30 flex flex-col gap-3 rounded-md border p-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 text-sm">
                  <span>价格</span>
                  <Input
                    type="number"
                    min="0"
                    value={sku.price}
                    onChange={(event) =>
                      updateSku(skuIndex, { price: event.target.value })
                    }
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm">
                  <span>库存</span>
                  <Input
                    type="number"
                    min="0"
                    value={sku.stock}
                    onChange={(event) =>
                      updateSku(skuIndex, { stock: event.target.value })
                    }
                  />
                </label>
              </div>
              {sku.specItems.map((item, itemIndex) => {
                const selectedSpec = specs.find(
                  (spec) => String(spec.specId) === item.specId,
                );
                return (
                  <div
                    key={itemIndex}
                    className="flex items-end gap-2"
                  >
                    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
                      <span>规格</span>
                      <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        value={item.specId}
                        onChange={(event) =>
                          updateSpecItem(skuIndex, itemIndex, {
                            specId: event.target.value,
                            valueId: "",
                          })
                        }
                      >
                        <option value="">选择规格</option>
                        {specs.map((spec) => (
                          <option
                            key={spec.specId}
                            value={spec.specId}
                          >
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
                      <span>规格值</span>
                      <select
                        className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                        value={item.valueId}
                        disabled={!selectedSpec}
                        onChange={(event) =>
                          updateSpecItem(skuIndex, itemIndex, {
                            valueId: event.target.value,
                          })
                        }
                      >
                        <option value="">选择规格值</option>
                        {selectedSpec?.values?.map((value) => (
                          <option
                            key={value.specValueId}
                            value={value.specValueId}
                          >
                            {value.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {sku.specItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="删除规格项"
                        onClick={() =>
                          updateSku(skuIndex, {
                            specItems: sku.specItems.filter(
                              (_, index) => index !== itemIndex,
                            ),
                          })
                        }
                      >
                        <XIcon />
                      </Button>
                    )}
                  </div>
                );
              })}
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    updateSku(skuIndex, {
                      specItems: [
                        ...sku.specItems,
                        { specId: "", valueId: "" },
                      ],
                    })
                  }
                >
                  <PlusIcon data-icon="inline-start" />
                  添加规格项
                </Button>
                {skus.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      setSkus(skus.filter((_, index) => index !== skuIndex))
                    }
                  >
                    删除此 SKU
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [skus, setSkus] = useState<SkuDraft[]>([emptySku()]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  function openCreate() {
    setEditingProduct(null);
    setName("");
    setCategoryId("");
    setDescription("");
    setSkus([emptySku()]);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(product: Product) {
    setEditingProduct(product);
    setName(product.name);
    setCategoryId(String(product.categoryId));
    setDescription(product.desc ?? "");
    setSkus([emptySku()]);
    setFormError(null);
    setFormOpen(true);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setNameQuery(nameInput.trim());
  }

  function parseSkus(): ProductSkuInput[] | null {
    const result: ProductSkuInput[] = [];
    for (const sku of skus) {
      const price = Number(sku.price);
      const stock = Number(sku.stock);
      if (
        !Number.isInteger(price) ||
        price < 0 ||
        !Number.isInteger(stock) ||
        stock < 0
      )
        return null;
      const specItems = sku.specItems.map((item) => ({
        specId: Number(item.specId),
        valueId: Number(item.valueId),
      }));
      if (
        specItems.some(
          (item) =>
            !Number.isInteger(item.specId) ||
            !Number.isInteger(item.valueId) ||
            item.specId <= 0 ||
            item.valueId <= 0,
        )
      )
        return null;
      result.push({ price, stock, specItems });
    }
    return result;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedCategoryId = Number(categoryId);
    if (
      !trimmedName ||
      !Number.isInteger(parsedCategoryId) ||
      parsedCategoryId <= 0
    ) {
      setFormError("请填写商品名称并选择分类");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingProduct) {
        await updateProduct({
          productId: editingProduct.productId,
          name: trimmedName,
          categoryId: parsedCategoryId,
          desc: description.trim(),
        });
      } else {
        const parsedSkus = parseSkus();
        if (!parsedSkus) {
          setFormError("请正确填写 SKU 的价格、库存和规格值");
          return;
        }
        await createProduct({
          categoryId: parsedCategoryId,
          name: trimmedName,
          desc: description.trim(),
          skus: parsedSkus,
        });
      }
      setFormOpen(false);
      setPage(1);
      setNameQuery(nameQuery);
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "保存失败,请稍后重试",
      );
    } finally {
      setSaving(false);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const categoryName = new Map(
    categories.map((category) => [category.categoryId, category.name]),
  );

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
          onClick={openCreate}
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
      {error ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>加载失败</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            重试
          </Button>
        </Empty>
      ) : loading ? (
        <div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
          <Spinner />
          加载中…
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {[
                  "商品 ID",
                  "商品名称",
                  "分类",
                  "SKU",
                  "状态",
                  "更新时间",
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
              {products.map((product) => (
                <tr
                  key={product.productId}
                  className="border-t"
                >
                  <td className="px-3 py-2.5">{product.productId}</td>
                  <td className="px-3 py-2.5 font-medium">{product.name}</td>
                  <td className="px-3 py-2.5">
                    {categoryName.get(product.categoryId) ?? product.categoryId}
                  </td>
                  <td className="px-3 py-2.5">{product.skus?.length ?? 0}</td>
                  <td className="px-3 py-2.5">
                    {product.status === 1 ? "上架" : "下架"}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {formatDate(product.updatedAt)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`编辑商品 ${product.name}`}
                      onClick={() => openEdit(product)}
                    >
                      <PencilIcon />
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
            <EmptyTitle>暂无商品</EmptyTitle>
            <EmptyDescription>没有找到符合条件的商品。</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">共 {total} 件商品</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              上一页
            </Button>
            <span>
              第 {page} / {totalPages} 页
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={formOpen}
        onOpenChange={setFormOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "编辑商品" : "新建商品"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "修改商品的基础信息。SKU 由创建接口维护。"
                : "填写商品基础信息并配置 SKU。"}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
          >
            <ProductFormFields
              name={name}
              setName={setName}
              categoryId={categoryId}
              setCategoryId={setCategoryId}
              description={description}
              setDescription={setDescription}
              categories={categories}
              skus={skus}
              setSkus={setSkus}
              showSkus={!editingProduct}
              specs={specs}
            />
            {formError && (
              <p className="text-destructive text-sm">{formError}</p>
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
    </div>
  );
}

export default ProductsPage;
