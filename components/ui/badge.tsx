import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/hooks/utils"

const badgeVariants = cva(    
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/20 focus-visible:ring-2 focus-visible:ring-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-300 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm [a&]:hover:from-purple-700 [a&]:hover:to-blue-700",
        secondary:
          "border-transparent bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 shadow-sm [a&]:hover:from-slate-200 [a&]:hover:to-slate-300",
        destructive:
          "border-transparent bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm [a&]:hover:from-red-600 [a&]:hover:to-pink-600 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "text-slate-700 border-slate-200 bg-white/80 [a&]:hover:bg-slate-50 [a&]:hover:text-slate-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
