import { useState, useCallback } from "react";

export const useToggle = (initial = false) => {
  const [open, setOpen] = useState(initial);
  
  const openOn = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(v => !v), []);
  
  return { open, openOn, close, toggle, setOpen };
};
