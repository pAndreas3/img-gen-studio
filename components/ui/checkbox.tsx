import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, id, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        id={id}
        className={cn(
          "h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500",
          className
        )}
        {...props}
      />
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox } 