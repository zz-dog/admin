import { api, unwrap, type ApiResponse } from "@/lib/api";

export interface CreateCategoryParams {
  name: string;
  parentId: number | null;
  sort: number;
}

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
