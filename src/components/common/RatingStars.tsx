import { Star } from 'lucide-react'
import { cn } from '@/lib/cn'

export function RatingStars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-0.5', className)} aria-label={`تقييم ${value.toFixed(1)} من 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= Math.round(value) ? 'fill-amber-accent text-amber-accent' : 'fill-transparent text-line'}
        />
      ))}
    </div>
  )
}

export function RatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} نجوم`}>
          <Star size={28} className={n <= value ? 'fill-amber-accent text-amber-accent' : 'fill-transparent text-line'} />
        </button>
      ))}
    </div>
  )
}
