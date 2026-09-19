import type { ReactNode } from 'react'
import { Card } from '@/components/ui/primitives'

export function StatCard({ label, value, icon }: { label: string; value: string | number; icon: ReactNode }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-lg font-bold text-ink">{value}</p>
      </div>
    </Card>
  )
}
