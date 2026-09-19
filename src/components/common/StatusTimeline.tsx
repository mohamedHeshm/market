import { Check } from 'lucide-react'
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from '@/constants'
import type { OrderStatus } from '@/types'
import { cn } from '@/lib/cn'

export function StatusTimeline({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'REJECTED') {
    return (
      <div className="rounded-card border border-danger/30 bg-danger/5 p-4 text-sm font-medium text-danger">
        {ORDER_STATUS_LABELS[status]}
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_STEPS.indexOf(status)

  return (
    <ol className="flex flex-col gap-0">
      {ORDER_STATUS_STEPS.map((step, i) => {
        const done = i < currentIndex
        const current = i === currentIndex
        const isLast = i === ORDER_STATUS_STEPS.length - 1
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px]',
                  done && 'border-brand-700 bg-brand-700 text-white',
                  current && 'border-brand-700 bg-white text-brand-700',
                  !done && !current && 'border-line bg-white text-muted'
                )}
              >
                {done ? <Check size={13} /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              {!isLast && <span className={cn('w-0.5 flex-1 min-h-6', done ? 'bg-brand-700' : 'bg-line')} />}
            </div>
            <p className={cn('pb-6 pt-0.5 text-sm', current ? 'font-semibold text-ink' : done ? 'text-ink-soft' : 'text-muted')}>
              {ORDER_STATUS_LABELS[step]}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
