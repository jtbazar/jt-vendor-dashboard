import { BarChart3, Database, Info } from 'lucide-react'
import { Card, PageHeader } from '../components/ui'

export function AnalyticsPage() {
  return (
    <div className="space-y-4">
      <PageHeader eyebrow={<><BarChart3 size={12}/> Performance reporting</>} title="Your business analytics." description="Analytics will use verified marketplace reporting data. Demo revenue charts, sales rankings and estimated margins have been removed."/>
      <Card className="p-8 sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-cream-100 text-sage-700"><Database size={22}/></span>
        <h2 className="mt-4 text-center font-display text-base font-semibold text-forest">Live analytics are not connected yet</h2>
        <p className="mx-auto mt-2 max-w-lg text-center text-xs leading-relaxed text-muted">Your products, inventory and orders are loaded from live seller APIs. Revenue trends, category performance, conversion rates and peak-hour reports need a verified analytics source. Until that is connected, this page will not display sample charts or invented figures.</p>
        <div className="mx-auto mt-5 flex max-w-lg items-start gap-2 rounded-xl border border-line bg-cream-50 p-3 text-[10px] leading-relaxed text-muted"><Info size={13} className="mt-0.5 flex-none text-sage-700"/>No database schema or reporting data has been changed to create placeholder analytics.</div>
      </Card>
    </div>
  )
}
