import { forwardRef, type SelectHTMLAttributes, type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, id, children, ...props }, ref) => {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={cn(
          'h-11 w-full rounded-lg border bg-surface px-3.5 text-sm text-ink transition-colors',
          error ? 'border-danger' : 'border-line focus:border-brand-600',
          'outline-none focus:ring-2 focus:ring-brand-600/20',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
})
Select.displayName = 'Select'

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-surface', className)} {...props} />
}

const badgeTones: Record<string, string> = {
  neutral: 'bg-black/5 text-ink-soft',
  brand: 'bg-brand-50 text-brand-800',
  amber: 'bg-amber-accent/15 text-amber-accent-dark',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
}

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof badgeTones }) {
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', badgeTones[tone], className)}
      {...props}
    />
  )
}
