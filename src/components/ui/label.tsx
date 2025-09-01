import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Composant Label pour les formulaires
 * - Style cohérent avec les autres composants UI
 * - Support des variants et tailles
 * - Accessibilité avec htmlFor
 */

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  className?: string
}

function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Label }