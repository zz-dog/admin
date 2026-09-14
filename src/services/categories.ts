import { api, unwrap, type ApiResponse } from "@/lib/api";

/** 产品分类(通过 parentId 关联成树) */
export interface Category {
  categoryId: number;
  name: string;
  parentId: number | null;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryParams {
  name: string;
  parentId: number | null;
  sort: number;
}

/** 更新分类参数(均为可选,未传字段不修改) */
export interface UpdateCategoryParams {
  name?: string;
  parentId?: number | null;
  sort?: number;
}

/** 分类绑定规格中的规格值(后端字段为下划线风格) */
export interface CategorySpecValue {
  value_id: number;
  name: string;
  sort: number;
}

/** 分类与规格的绑定关系(后端字段为下划线风格) */
export interface CategorySpec {
  category_id: number;
  spec_id: number;
  spec_name: string;
  required: boolean;
  sort: number;
  values: CategorySpecValue[] | null;
}

export interface BindSpecParams {
  categoryId: number;
  specId: number;
  required: boolean;
  sort: number;
}

/** 获取全量分类列表 */
export async function findAllCategories(): Promise<Category[]> {
  return unwrap(api<ApiResponse<Category[]>>("/category/findAll"));
}

/** 创建分类 */
export async function createCategory(
  params: CreateCategoryParams,
): Promise<void> {
  await unwrap(
    api<ApiResponse<void>>("/category/create", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  );
}

/** 更新分类(部分更新,未传字段不修改) */
export async function updateCategory(
  categoryId: number,
  params: UpdateCategoryParams,
): Promise<Category> {
  return unwrap(
    api<ApiResponse<Category>>(`/category/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(params),
    }),
  );
}

/** 删除分类 */
export async function deleteCategory(categoryId: number): Promise<void> {
  await unwrap(
    api<ApiResponse<void>>(`/category/${categoryId}`, {
      method: "DELETE",
    }),
  );
}

/** 查询分类绑定的规格(含规格值/排序/是否必选) */
export async function findCategorySpecs(
  categoryId: number,
): Promise<CategorySpec[]> {
  return unwrap(
    api<ApiResponse<CategorySpec[]>>(`/category/findSpecs/${categoryId}`),
  );
}

/** 绑定规格到分类(重复绑定返回错误) */
export async function bindSpec(params: BindSpecParams): Promise<CategorySpec> {
  return unwrap(
    api<ApiResponse<CategorySpec>>("/category/bindSpec", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  );
}

/** 解除分类与规格的绑定 */
export async function unbindSpec(
  categoryId: number,
  specId: number,
): Promise<void> {
  const search = new URLSearchParams({
    categoryId: String(categoryId),
    specId: String(specId),
  });
  await unwrap(
    api<ApiResponse<void>>(`/category/unbindSpec?${search.toString()}`, {
      method: "DELETE",
    }),
  );
}
