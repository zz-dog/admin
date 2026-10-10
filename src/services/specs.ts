import { api, unwrap, type ApiResponse } from "@/lib/api";

/** 规格值(如"红色") */
export interface SpecValue {
  specValueId: number;
  specId: number;
  name: string;
  sort: number;
}

/** 规格维度(如"颜色") */
export interface Spec {
  specId: number;
  name: string;
  sort: number;
  values: SpecValue[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface SpecListParams {
  page: number;
  pageSize: number;
  /** 规格名称(模糊搜索) */
  name?: string;
  specId?: number;
  signal?: AbortSignal;
}

export interface SpecListData {
  list: Spec[];
  total: number;
}

/** 创建规格时可一并传入的规格值 */
export interface CreateSpecValueInput {
  name: string;
}

export interface CreateSpecParams {
  name: string;
  /** 规格值列表(可选,一次性创建) */
  values?: CreateSpecValueInput[];
}

/** 分页查询规格列表 */
export async function listSpecs(params: SpecListParams): Promise<SpecListData> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.name) {
    search.set("name", params.name);
  }
  if (params.specId != null) {
    search.set("specId", String(params.specId));
  }
  return unwrap(
    api<ApiResponse<SpecListData>>(`/catalog/spec/list?${search.toString()}`, {
      signal: params.signal,
    }),
  );
}

/** 创建规格(同名规格已存在时返回错误,可一并传入规格值) */
export async function createSpec(params: CreateSpecParams): Promise<Spec> {
  return unwrap(
    api<ApiResponse<Spec>>("/catalog/spec/register", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  );
}

/** 更新规格参数(规格值整体提交,由后端替换) */
export interface UpdateSpecParams {
  name: string;
  /** 规格值列表 */
  values?: CreateSpecValueInput[];
}

/** 更新规格 */
export async function updateSpec(
  specId: number,
  params: UpdateSpecParams,
): Promise<Spec> {
  return unwrap(
    api<ApiResponse<Spec>>(`/catalog/spec/update/${specId}`, {
      method: "PUT",
      body: JSON.stringify(params),
    }),
  );
}

/** 根据 ID 查询规格详情 */
export async function findSpecById(specId: number): Promise<Spec> {
  return unwrap(api<ApiResponse<Spec>>(`/catalog/spec/findById/${specId}`));
}

/** 根据名称精确查询规格详情 */
export async function findSpecByName(name: string): Promise<Spec> {
  return unwrap(
    api<ApiResponse<Spec>>(
      `/catalog/spec/findByName/${encodeURIComponent(name)}`,
    ),
  );
}

/** 删除规格 */
export async function deleteSpec(specId: number): Promise<void> {
  await unwrap(
    api<ApiResponse<void>>(`/catalog/spec/delete/${specId}`, {
      method: "DELETE",
    }),
  );
}
