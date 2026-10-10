import { api, unwrap, type ApiResponse } from "@/lib/api";

export interface ProductSpecItem {
  specId: number;
  specName: string;
  valueId: number;
  valueName: string;
}

export interface Sku {
  price: number;
  skuCode: string;
  specDesc: string;
  specItems: ProductSpecItem[];
  stock: number;
}

export interface Product {
  productId: number;
  categoryId: number;
  name: string;
  desc: string;
  skus: Sku[];
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListData {
  list: Product[];
  total: number;
}

export interface ProductListParams {
  page: number;
  pageSize: number;
  categoryId?: number;
  productId?: number;
  name?: string;
  signal?: AbortSignal;
}

export interface ProductSpecItemInput {
  specId: number;
  valueId: number;
}

export interface ProductSkuInput {
  price: number;
  stock: number;
  specItems: ProductSpecItemInput[];
}

export interface CreateProductParams {
  categoryId: number;
  name: string;
  desc?: string;
  skus: ProductSkuInput[];
}

export interface UpdateProductParams {
  productId: number;
  categoryId?: number;
  name?: string;
  desc?: string;
  urls?: string[];
}

export async function listProducts(
  params: ProductListParams,
): Promise<ProductListData> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });
  if (params.categoryId != null)
    search.set("categoryId", String(params.categoryId));
  if (params.productId != null)
    search.set("productId", String(params.productId));
  if (params.name) search.set("name", params.name);

  return unwrap(
    api<ApiResponse<ProductListData>>(
      `/catalog/product/list?${search.toString()}`,
      {
        method: "POST",
        signal: params.signal,
      },
    ),
  );
}

export async function createProduct(
  params: CreateProductParams,
): Promise<Product> {
  return unwrap(
    api<ApiResponse<Product>>("/catalog/product/create", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  );
}

export async function updateProduct(
  params: UpdateProductParams,
): Promise<Product> {
  return unwrap(
    api<ApiResponse<Product>>("/catalog/product/update", {
      method: "POST",
      body: JSON.stringify(params),
    }),
  );
}
