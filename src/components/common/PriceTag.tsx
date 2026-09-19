import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/primitives'
import { formatCurrency } from '@/utils/pricing'

interface PriceTagProps {
  originalPrice: number
  finalPrice: number
  discountLabel?: string | null
  size?: 'sm' | 'md' | 'lg'
  /** Show the discount badge next to the price. Defaults to true. */
  showBadge?: boolean
  className?: string
}

const SIZE_CLASSES: Record<NonNullable<PriceTagProps['size']>, { final: string; original: string }> = {
  sm: { final: 'text-sm font-semibold', original: 'text-xs' },
  md: { final: 'text-base font-semibold', original: 'text-sm' },
  lg: { final: 'text-lg font-bold', original: 'text-sm' },
}

/**
 * Single place responsible for how a price + discount looks across the
 * whole app (Product Card, Product Details, Cart, Checkout, Order Details,
 * Admin product management, ...). Always fed the already-computed numbers
 * from `utils/pricing.ts` — this component has no pricing logic of its own.
 */
export function PriceTag({ originalPrice, finalPrice, discountLabel, size = 'md', showBadge = true, className }: PriceTagProps) {
  const hasDiscount = finalPrice < originalPrice
  const s = SIZE_CLASSES[size]

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <span className={cn(s.final, 'text-brand-800')}>{formatCurrency(finalPrice)}</span>
      {hasDiscount && (
        <>
          <span className={cn(s.original, 'text-muted line-through')}>{formatCurrency(originalPrice)}</span>
          {showBadge && discountLabel && <Badge tone="amber">{discountLabel}</Badge>}
        </>
      )}
    </div>
  )
}
