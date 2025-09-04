"use client"

import * as React from "react"
import { AlertTriangle, Trash2, Info, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ConfirmDialogVariant = "default" | "destructive" | "warning" | "info"

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: ConfirmDialogVariant
  isLoading?: boolean
}

const variantConfig = {
  default: {
    icon: CheckCircle,
    iconColor: "text-blue-600",
    confirmButtonVariant: "default" as const,
  },
  destructive: {
    icon: Trash2,
    iconColor: "text-red-600",
    confirmButtonVariant: "destructive" as const,
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
    confirmButtonVariant: "default" as const,
  },
  info: {
    icon: Info,
    iconColor: "text-blue-600", 
    confirmButtonVariant: "default" as const,
  },
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "default",
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      console.error("Erreur lors de la confirmation:", error)
      // L'erreur sera gérée par le composant parent
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 ${config.iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-left">{title}</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        {description && (
          <DialogDescription className="text-left text-gray-600 mt-2">
            {description}
          </DialogDescription>
        )}

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={config.confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Traitement...</span>
              </div>
            ) : (
              confirmLabel
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook pour utiliser facilement le dialog de confirmation
export function useConfirmDialog() {
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    props: Omit<ConfirmDialogProps, "open" | "onOpenChange"> | null
  }>({
    isOpen: false,
    props: null,
  })

  const openDialog = React.useCallback((props: Omit<ConfirmDialogProps, "open" | "onOpenChange">) => {
    setDialogState({
      isOpen: true,
      props,
    })
  }, [])

  const closeDialog = React.useCallback(() => {
    setDialogState({
      isOpen: false,
      props: null,
    })
  }, [])

  const ConfirmDialogComponent = React.useMemo(() => {
    if (!dialogState.props) return null

    return (
      <ConfirmDialog
        {...dialogState.props}
        open={dialogState.isOpen}
        onOpenChange={closeDialog}
      />
    )
  }, [dialogState, closeDialog])

  return {
    openConfirmDialog: openDialog,
    ConfirmDialog: ConfirmDialogComponent,
  }
}