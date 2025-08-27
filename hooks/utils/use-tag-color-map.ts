import { useMemo } from "react";
import type { TTag } from "@/types/global";

export const useTagColorMap = (tags: TTag[] = []) =>
  useMemo(() => 
    tags.reduce((map, tag) => {
      map[tag.name] = tag.color;
      return map;
    }, {} as Record<string, string>), 
    [tags]
  );
