import { useMemo } from "react";

export const usePagination = (page: number, pageSize: number, total?: number) => {
  const hasPrev = page > 1;
  const hasNext = typeof total === "number" ? page * pageSize < total : true;
  
  const visible = useMemo(() => {
    const start = Math.max(1, page - 2);
    const end = page;
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page]);
  
  return { hasPrev, hasNext, visible };
};
