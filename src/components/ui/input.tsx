import * as React from "react"
import { cn } from "@/lib/Utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base
          "flex w-full font-sans text-[0.9375rem] text-slate-900",
          // Sizing
          "h-11 rounded-xl px-3.5 py-2.5",
          // Border & background
          "border border-slate-300 bg-white",
          // Placeholder
          "placeholder:text-slate-400",
          // File input
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-700",
          // Focus state
          "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-[3px] focus-visible:ring-blue-500/15",
          // Transition
          "transition-[border-color,box-shadow] duration-150",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
