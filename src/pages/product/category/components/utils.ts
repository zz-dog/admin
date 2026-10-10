import type { Category } from "@/services/categories";

/** 树形表格里的一行(带层级深度) */
export interface CategoryRow {
  category: Category;
  depth: number;
}

/** 把扁平列表按 parentId 组装成树并展开成行,每层按 sort 升序 */
export function buildRows(categories: Category[]): CategoryRow[] {
  const ids = new Set(categories.map((c) => c.categoryId));
  const childrenMap = new Map<number, Category[]>();
  const roots: Category[] = [];
  for (const category of categories) {
    // 父级为空或指向不存在的分类时,当作顶级展示
    if (category.parentId === null || !ids.has(category.parentId)) {
      roots.push(category);
    } else {
      const siblings = childrenMap.get(category.parentId);
      if (siblings) {
        siblings.push(category);
      } else {
        childrenMap.set(category.parentId, [category]);
      }
    }
  }
  const sortByOrder = (a: Category, b: Category) =>
    a.sort - b.sort || a.categoryId - b.categoryId;

  const rows: CategoryRow[] = [];
  const visited = new Set<number>();
  function walk(list: Category[], depth: number) {
    for (const category of [...list].sort(sortByOrder)) {
      if (visited.has(category.categoryId)) continue; // 防御数据成环
      visited.add(category.categoryId);
      rows.push({ category, depth });
      walk(childrenMap.get(category.categoryId) ?? [], depth + 1);
    }
  }
  walk(roots, 0);
  return rows;
}

/** 找出某分类及其全部后代(编辑时禁止把父级设为这些分类,避免成环) */
export function findSelfAndDescendantIds(
  rows: CategoryRow[],
  categoryId: number,
): Set<number> {
  const ids = new Set<number>([categoryId]);
  let started = false;
  let baseDepth = 0;
  for (const row of rows) {
    if (row.category.categoryId === categoryId) {
      started = true;
      baseDepth = row.depth;
      continue;
    }
    if (!started) continue;
    if (row.depth > baseDepth) {
      ids.add(row.category.categoryId);
    } else {
      break;
    }
  }
  return ids;
}

/** 原生 select 的统一样式(ui 库暂无 Select 组件) */
export const SELECT_CLASS =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30";
