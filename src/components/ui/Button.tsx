import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants: Record<string, string> = {
  primary: 'bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-900 disabled:bg-brand-300',
  secondary: 'bg-amber-accent text-ink hover:bg-amber-accent-dark disabled:opacity-50',
  outline: 'border border-line bg-surface text-ink hover:bg-bg disabled:opacity-50',
  ghost: 'text-ink hover:bg-black/5 disabled:opacity-50',
  danger: 'bg-danger text-white hover:brightness-95 disabled:opacity-50',
}

const sizes: Record<string, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
