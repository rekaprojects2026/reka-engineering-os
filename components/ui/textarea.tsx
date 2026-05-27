import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        data-slot="textarea"
        className={cn(
          "flex min-h-[80px] w-full rounded-[var(--radius-control)] border border-[var(--input-border)] bg-[var(--input-bg)] px-3 py-2 text-[0.8125rem] text-[var(--text-primary-neutral)] placeholder:text-[var(--input-placeholder)] resize-y transition-colors",
          "focus-visible:outline-none focus-visible:border-[var(--input-focus-border)] focus-visible:bg-[var(--input-bg-focus)] focus-visible:ring-[3px] focus-visible:ring-[color:var(--input-focus-ring)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
