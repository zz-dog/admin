import type { ProductSkuInput } from "@/services/products";

const PAGE_SIZE = 10;

/** SKU 编辑草稿(价格/库存为字符串,提交时再解析) */
type SkuDraft = {
  price: string;
  stock: string;
  specItems: { specId: string; valueId: string }[];
};

function emptySku(): SkuDraft {
  return { price: "0", stock: "0", specItems: [{ specId: "", valueId: "" }] };
}

/** 把 SKU 草稿解析成接口入参,校验不通过返回 null */
function parseSkus(skus: SkuDraft[]): ProductSkuInput[] | null {
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

/** 原生 select 的统一样式(ui 库暂无 Select 组件) */
const SELECT_CLASS =
  "border-input bg-background h-9 rounded-md border px-3 text-sm";

export { PAGE_SIZE, SELECT_CLASS, emptySku, parseSkus };
export type { SkuDraft };
