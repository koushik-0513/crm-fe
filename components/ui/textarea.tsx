import * as React from "react"

import { cn } from "@/hooks/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-xl border bg-transparent px-4 py-3 text-base shadow-sm transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "hover:border-slate-300 focus:border-purple-300",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
