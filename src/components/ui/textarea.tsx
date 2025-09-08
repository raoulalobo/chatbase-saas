import * as React from "react"

import { cn } from "@/lib/utils"

// Interface pour les props du Textarea component
interface TextareaProps extends React.ComponentProps<"textarea"> {}

// Composant Textarea réutilisable avec styles cohérents
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        data-slot="textarea"
        className={cn(
          // Styles de base pour le textarea
          "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
          "border-input flex min-h-[60px] w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs",
          "transition-[color,box-shadow] outline-none resize-vertical",
          // États de focus et validation
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          // État désactivé
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
          // Responsive text size
          "md:text-sm",
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }