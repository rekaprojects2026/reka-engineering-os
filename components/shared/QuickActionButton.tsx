'use client'

import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface QuickActionButtonProps {
  label:       string
  icon?:       ReactNode
  onClick?:    () => void
  variant?:    ButtonVariant
  disabled?:   boolean
  className?:  string
  type?:       'button' | 'submit' | 'reset'
  'aria-label'?: string
}

const variantMap: Record<ButtonVariant, ButtonProps['variant']> = {
  primary:   'default',
  secondary: 'outline',
  ghost:     'ghost',
  danger:    'destructive',
}

export function QuickActionButton({
  label,
  icon,
  onClick,
  variant = 'secondary',
  disabled = false,
  className,
  type = 'button',
  'aria-label': ariaLabel,
}: QuickActionButtonProps) {
  return (
    <Button
      type={type}
      variant={variantMap[variant]}
      size="default"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? label}
      className={cn(className)}
    >
      {icon && <span aria-hidden="true" className="flex items-center">{icon}</span>}
      {label}
    </Button>
  )
}
