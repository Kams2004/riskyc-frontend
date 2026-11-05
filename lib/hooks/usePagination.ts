import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination for an admin list. Goes back to page 1 whenever `resetKey` changes (a search or filter),
 * and never points past the last page when the list shrinks (e.g. after a delete).
 */
export function usePagination<T>(items: T[], initialPageSize = 10, resetKey: unknown = undefined) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => items.slice((safePage - 1) * pageSize, safePage * pageSize), [items, safePage, pageSize]);

  return { page: safePage, setPage, pageSize, setPageSize, totalPages, total: items.length, pageItems };
}
