/**
 * 格式化日期：2026-10-10T15:52:09.166+08:00 -> 2026年10月10日
 * 传入空值或非法时间时返回占位符 "-"
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
}
