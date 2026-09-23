import * as React from "react"
import { cn } from "@/lib/Utils"
import { cva, type VariantProps } from "class-variance-authority"

const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5",
    "text-xs font-semibold leading-none tracking-wide",
    "transition-colors duration-150",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-blue-200 bg-blue-50 text-blue-700",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-600",
        destructive:
          "border-red-200 bg-red-50 text-red-700",
        outline:
          "border-slate-300 bg-transparent text-slate-700",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        info:
          "border-sky-200 bg-sky-50 text-sky-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
