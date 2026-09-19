import { useState } from 'react'
import { toast } from 'sonner'
import { Package, Percent, X } from 'lucide-react'
import { useProducts, useProductMutations } from '@/features/products/hooks'
import { useStores } from '@/features/stores/hooks'
import { Badge, Select, Card } from '@/components/ui/primitives'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/common/States'
import { PriceTag } from '@/components/common/PriceTag'
import { getPricing, formatCurrency } from '@/utils/pricing'
import type { Product } from '@/types'

export default function AdminProductsPage() {
  const [storeId, setStoreId] = useState('')
  const { data: stores } = useStores('', true)
  const { data: productData, isLoading } = useProducts({ storeId: storeId || undefined, includeInactive: true, pageSize: 50 })
  const { update } = useProductMutations()
  const [editingDiscount, setEditingDiscount] = useState<Product | null>(null)
  const [discountValue, setDiscountValue] = useState('')

  const storeName = (id: string) => stores?.find((s) => s.id === id)?.name ?? ''

  function openDiscountEditor(p: Product) {
    setEditingDiscount(p)
    setDiscountValue(p.discount_value != null ? String(p.discount_value) : '')
  }

  async function handleSaveDiscount() {
    if (!editingDiscount) return
    const value = Number(discountValue)
    if (!value || value <= 0 || value > 100) {
      toast.error('نسبة الخصم يجب أن تكون بين 1 و100')
      return
    }
    try {
      await update.mutateAsync({ id: editingDiscount.id, payload: { discount_type: 'PERCENTAGE', discount_value: value } })
      toast.success('تم تحديث الخصم')
      setEditingDiscount(null)
    } catch {
      toast.error('تعذر تحديث الخصم')
    }
  }

  async function handleRemoveDiscount(p: Product) {
    try {
      await update.mutateAsync({ id: p.id, payload: { discount_type: null, discount_value: null } })
      toast.success('تم إزالة الخصم')
    } catch {
      toast.error('تعذر إزالة الخصم')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-bold text-ink">المنتجات</h1>

      <Select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="sm:w-64">
        <option value="">كل المتاجر</option>
        {stores?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>

      {editingDiscount && (
        <Card className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">تعديل خصم: {editingDiscount.name}</h2>
            <button onClick={() => setEditingDiscount(null)} className="text-muted" aria-label="إغلاق">
              <X size={16} />
            </button>
          </div>
          <Input
            label="نسبة الخصم (%)"
            type="number"
            min="1"
            max="100"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder="مثال: 20"
          />
          {Number(discountValue) > 0 && (
            <div className="rounded-lg bg-bg p-3">
              <p className="mb-1.5 text-xs text-muted">معاينة السعر النهائي</p>
              <PriceTag
                {...getPricing({ price: editingDiscount.price, discount_type: 'PERCENTAGE', discount_value: Number(discountValue) })}
                size="lg"
              />
            </div>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveDiscount} loading={update.isPending}>
              حفظ الخصم
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingDiscount(null)}>
              إلغاء
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? null : !productData || productData.items.length === 0 ? (
        <EmptyState title="لا توجد منتجات" icon={<Package size={22} />} />
      ) : (
        <div className="overflow-x-auto scroll-thin rounded-card border border-line bg-surface">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="px-4 py-3 text-start font-medium">المنتج</th>
                <th className="px-4 py-3 text-start font-medium">المتجر</th>
                <th className="px-4 py-3 text-start font-medium">السعر الأصلي</th>
                <th className="px-4 py-3 text-start font-medium">الخصم</th>
                <th className="px-4 py-3 text-start font-medium">السعر النهائي</th>
                <th className="px-4 py-3 text-start font-medium">الحالة</th>
                <th className="px-4 py-3 text-start font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {productData.items.map((p) => {
                const pricing = getPricing(p)
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{storeName(p.store_id)}</td>
                    <td className="px-4 py-3 text-ink-soft">{formatCurrency(pricing.originalPrice)}</td>
                    <td className="px-4 py-3">
                      {pricing.hasDiscount ? (
                        <Badge tone="amber">{pricing.discountLabel}</Badge>
                      ) : (
                        <span className="text-xs text-muted">بدون خصم</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-brand-800">{formatCurrency(pricing.finalPrice)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={p.is_active ? 'success' : 'danger'}>{p.is_active ? 'نشط' : 'معطل'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openDiscountEditor(p)}>
                          <Percent size={13} /> {pricing.hasDiscount ? 'تعديل الخصم' : 'إضافة خصم'}
                        </Button>
                        {pricing.hasDiscount && (
                          <Button size="sm" variant="outline" onClick={() => handleRemoveDiscount(p)}>
                            إزالة
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => update.mutate({ id: p.id, payload: { is_active: !p.is_active } })}>
                          {p.is_active ? 'تعطيل' : 'تفعيل'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
