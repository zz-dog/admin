import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Spec } from "@/services/specs";

import { emptySku, SELECT_CLASS, type SkuDraft } from "./utils";

interface SkuEditorProps {
  skus: SkuDraft[];
  onChange: (skus: SkuDraft[]) => void;
  /** 可选的规格列表(用于规格/规格值下拉) */
  specs: Spec[];
}

/** SKU 规格编辑区:维护多个 SKU 的价格、库存与规格项 */
function SkuEditor({ skus, onChange, specs }: SkuEditorProps) {
  function updateSku(index: number, patch: Partial<SkuDraft>) {
    onChange(
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
    onChange(
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
    <div className="flex flex-col gap-3 border-t pt-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">SKU 规格</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...skus, emptySku()])}
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
                    className={SELECT_CLASS}
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
                    className={SELECT_CLASS}
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
                  onChange(skus.filter((_, index) => index !== skuIndex))
                }
              >
                删除此 SKU
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export { SkuEditor };
