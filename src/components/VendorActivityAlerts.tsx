import { useEffect, useRef } from 'react'
import { useVendorAuth } from '../context/VendorAuthContext'
import { listVendorInventory, listVendorOrders } from '../services/marketplaceApi'
import { useApp } from '../store'

function orderCreatedAt(row: Record<string, any>) {
  const value = row.order_created_at ?? row.created_at
  const date = value ? new Date(String(value)) : null
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0
}

export function VendorActivityAlerts() {
  const { user } = useVendorAuth()
  const { pushToast } = useApp()
  const knownOrders = useRef<Set<string> | null>(null)
  const remindedOrders = useRef<Set<string>>(new Set())
  const knownLowStock = useRef<Set<string> | null>(null)

  useEffect(() => {
    knownOrders.current = null
    remindedOrders.current.clear()
    knownLowStock.current = null
    if (!user?.id) return

    let active = true
    let running = false

    const check = async () => {
      if (running || !active) return
      running = true
      try {
        const [rows, inventory] = await Promise.all([
          listVendorOrders({ pageSize: 48, status: 'all' }),
          listVendorInventory(),
        ])
        if (!active) return
        const grouped = new Map<string, Record<string, any>>()
        for (const row of rows) {
          const id = String(row.order_id ?? '')
          if (id && !grouped.has(id)) grouped.set(id, row as Record<string, any>)
        }
        const currentIds = new Set(grouped.keys())
        if (knownOrders.current) {
          const newOrders = [...currentIds].filter(id => !knownOrders.current?.has(id))
          for (const id of newOrders.slice(0, 3)) {
            const row = grouped.get(id)
            pushToast('New customer order', `Order #${String(row?.order_number ?? id.slice(0, 8))} has arrived. Open Orders to review it.`, 'info')
          }
        }
        knownOrders.current = currentIds

        const lowRows = inventory.filter((row: any) =>
          row.low_stock_threshold != null && Number(row.quantity ?? 0) <= Number(row.low_stock_threshold)
        )
        const lowIds = new Set(lowRows.map((row: any) => String(row.id ?? `${row.product_id}:${row.variant_id ?? 'default'}`)))
        if (knownLowStock.current) {
          for (const row of lowRows) {
            const key = String((row as any).id ?? `${(row as any).product_id}:${(row as any).variant_id ?? 'default'}`)
            if (!knownLowStock.current.has(key)) {
              const isOut = Number((row as any).quantity ?? 0) <= 0
              pushToast(isOut ? 'Product out of stock' : 'Low stock alert', `${String((row as any).product_name ?? 'A product')} needs a stock update. Open Inventory to adjust it.`, 'warning')
            }
          }
        }
        knownLowStock.current = lowIds

        const now = Date.now()
        for (const [id, row] of grouped) {
          const createdAt = orderCreatedAt(row)
          const confirmation = String(row.order_confirmation_status ?? '').toLowerCase()
          const fulfillment = String(row.vendor_fulfillment_status ?? '').toLowerCase()
          const pickup = String(row.pickup_status ?? '').toLowerCase()
          const stillWaiting = (confirmation !== 'confirmed' || pickup === 'awaiting_vendor') && !['delivered', 'cancelled', 'completed'].includes(fulfillment)
          if (createdAt && stillWaiting && now - createdAt >= 30 * 60 * 1000 && !remindedOrders.current.has(id)) {
            remindedOrders.current.add(id)
            pushToast('Order needs attention', `Order #${String(row.order_number ?? id.slice(0, 8))} has been waiting for over 30 minutes. Please review it.`, 'warning')
          }
        }
      } catch {
        // Alerts are best-effort; the Orders page remains the source of truth.
      } finally {
        running = false
      }
    }

    void check()
    const interval = window.setInterval(() => { void check() }, 60_000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [user?.id, pushToast])

  return null
}
