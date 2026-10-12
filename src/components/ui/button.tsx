import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/Utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "rounded-xl border-none cursor-pointer select-none",
    "transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-gradient-to-b from-blue-600 to-blue-700 text-white",
          "shadow-[0_2px_8px_rgba(37,99,235,0.35)]",
          "hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(37,99,235,0.45)]",
          "active:translate-y-0 active:shadow-[0_2px_8px_rgba(37,99,235,0.35)]",
        ].join(" "),
        destructive: [
          "bg-gradient-to-b from-red-500 to-red-600 text-white",
          "shadow-[0_2px_8px_rgba(239,68,68,0.3)]",
          "hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]",
        ].join(" "),
        outline: [
          "bg-transparent text-slate-700 border border-slate-300",
          "hover:bg-slate-50 hover:border-slate-400",
          "active:bg-slate-100",
        ].join(" "),
        secondary: [
          "bg-slate-100 text-slate-800",
          "hover:bg-slate-200",
          "active:bg-slate-300",
        ].join(" "),
        ghost: [
          "bg-transparent text-slate-600",
          "hover:bg-slate-100 hover:text-slate-900",
          "active:bg-slate-200",
        ].join(" "),
        link: [
          "bg-transparent text-blue-600 underline-offset-4",
          "hover:underline hover:text-blue-700",
          "shadow-none",
        ].join(" "),
      },
      size: {
        default: "h-[42px] px-5 text-sm [&_svg]:size-4",
        sm:      "h-9 px-3.5 text-[13px] [&_svg]:size-[14px]",
        lg:      "h-12 px-7 text-base [&_svg]:size-5",
        icon:    "h-10 w-10 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size:    "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
