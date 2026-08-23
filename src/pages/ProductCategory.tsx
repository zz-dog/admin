import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCategory } from "@/services/categories";

function ProductCategoryPage() {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [sort, setSort] = useState("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const parsedParentId = parentId.trim() ? Number(parentId) : null;
    const parsedSort = Number(sort);

    if (!trimmedName) {
      setError("请输入分类名称");
      return;
    }
    if (parsedParentId !== null && !Number.isInteger(parsedParentId)) {
      setError("父级分类 ID 必须是整数");
      return;
    }
    if (!Number.isInteger(parsedSort) || parsedSort < 0) {
      setError("排序必须是大于等于 0 的整数");
      return;
    }

    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      await createCategory({
        name: trimmedName,
        parentId: parsedParentId,
        sort: parsedSort,
      });
      setName("");
      setParentId("");
      setSort("0");
      setMessage("产品分类创建成功");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "创建失败,请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">产品分类</h1>
        <p className="text-muted-foreground text-sm">创建产品分类。</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>创建分类</CardTitle>
          <CardDescription>填写分类信息后提交。</CardDescription>
        </CardHeader>
        <CardContent>
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
                disabled={loading}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              父级分类 ID
              <Input
                type="number"
                min="1"
                step="1"
                value={parentId}
                onChange={(event) => setParentId(event.target.value)}
                placeholder="顶级分类可留空"
                disabled={loading}
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
                disabled={loading}
                required
              />
            </label>
            {error && <p className="text-destructive text-sm">{error}</p>}
            {message && <p className="text-sm text-green-600">{message}</p>}
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "提交中..." : "创建分类"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProductCategoryPage;
