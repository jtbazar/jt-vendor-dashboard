import { useId, useState } from 'react'
import { cx, formatPKR } from '../utils'

function buildPoints(values: number[], width: number, height: number, pad = 3) {
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  return values.map((value, index) => ({
    x: pad + (index / Math.max(1, values.length - 1)) * (width - pad * 2),
    y: height - pad - ((value - min) / range) * (height - pad * 2),
  }))
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]
    const current = points[index]
    const midX = (previous.x + current.x) / 2
    path += ` C ${midX} ${previous.y}, ${midX} ${current.y}, ${current.x} ${current.y}`
  }
  return path
}

/* ------------------------------------------------------------------ */
/* Sparkline                                                           */
/* ------------------------------------------------------------------ */

export function Sparkline({
  values,
  className,
  stroke = '#7D9463',
  fill = true,
}: {
  values: number[]
  className?: string
  stroke?: string
  fill?: boolean
}) {
  const rawId = useId()
  const gradientId = `spark-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const width = 120
  const height = 42
  const points = buildPoints(values, width, height, 4)
  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cx('h-10 w-[120px]', className)} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.24" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill ? <path d={area} fill={`url(#${gradientId})`} /> : null}
      <path d={line} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/* Area chart                                                          */
/* ------------------------------------------------------------------ */

export interface ChartDatum {
  label: string
  value: number
  orders?: number
}

export function AreaChart({
  data,
  height = 250,
  formatValue = formatPKR,
  className,
}: {
  data: ChartDatum[]
  height?: number
  formatValue?: (value: number) => string
  className?: string
}) {
  const rawId = useId()
  const gradientId = `area-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const [active, setActive] = useState<number | null>(null)

  const width = 760
  const left = 48
  const right = 14
  const top = 18
  const bottom = 34
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom

  const maxValue = Math.max(...data.map((item) => item.value), 1)
  const roughStep = maxValue / 4
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)))
  const normalized = roughStep / magnitude
  const stepMultiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const niceStep = stepMultiplier * magnitude
  const niceMax = Math.ceil(maxValue / niceStep) * niceStep
  const tickCount = Math.round(niceMax / niceStep) + 1
  const ticks = Array.from({ length: tickCount }, (_, index) => Math.round(niceStep * index))

  const points = data.map((item, index) => ({
    x: left + (index / Math.max(1, data.length - 1)) * chartWidth,
    y: top + chartHeight - (item.value / niceMax) * chartHeight,
  }))

  const line = smoothPath(points)
  const area = `${line} L ${points[points.length - 1].x} ${top + chartHeight} L ${points[0].x} ${top + chartHeight} Z`
  const labelEvery = Math.max(1, Math.ceil(data.length / 7))
  const activePoint = active !== null ? points[active] : null
  const activeDatum = active !== null ? data[active] : null

  return (
    <div className={cx('relative w-full select-none', className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="Revenue trend chart"
        onMouseLeave={() => setActive(null)}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          const chartRatio = (ratio * width - left) / chartWidth
          const index = Math.round(chartRatio * (data.length - 1))
          setActive(Math.max(0, Math.min(data.length - 1, index)))
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7D9463" stopOpacity="0.26" />
            <stop offset="72%" stopColor="#7D9463" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#7D9463" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => {
          const y = top + chartHeight - (tick / niceMax) * chartHeight
          return (
            <g key={tick}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#ECE8DD" strokeWidth="1" strokeDasharray="3 5" />
              <text x={left - 10} y={y + 3} textAnchor="end" fontSize="9" fill="#9AA093">
                {tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
              </text>
            </g>
          )
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke="#4F6B3C" strokeWidth="2.4" strokeLinecap="round" />

        {points.map((point, index) => {
          const isActive = active === index
          const isLast = index === points.length - 1
          if (!isActive && !isLast) return null
          return (
            <g key={data[index].label}>
              {isActive ? <line x1={point.x} x2={point.x} y1={top} y2={top + chartHeight} stroke="#C9D3BD" strokeWidth="1" /> : null}
              <circle cx={point.x} cy={point.y} r={isActive ? 5 : 4} fill="#FCFBF7" stroke="#4F6B3C" strokeWidth="2" />
            </g>
          )
        })}

        {data.map((item, index) =>
          index % labelEvery === 0 || index === data.length - 1 ? (
            <text key={item.label} x={points[index].x} y={height - 10} textAnchor="middle" fontSize="9" fill="#9AA093">
              {item.label}
            </text>
          ) : null,
        )}
      </svg>

      {activePoint && activeDatum ? (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[118%] rounded-lg border border-line bg-forest px-3 py-2 text-cream-50 shadow-lift"
          style={{ left: `${(activePoint.x / width) * 100}%`, top: `${(activePoint.y / height) * 100}%` }}
        >
          <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-sage-300">{activeDatum.label}</p>
          <p className="mt-0.5 whitespace-nowrap font-display text-xs font-semibold">{formatValue(activeDatum.value)}</p>
          {typeof activeDatum.orders === 'number' ? (
            <p className="mt-0.5 text-[9px] text-cream-200/70">{activeDatum.orders} orders</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Bar chart                                                           */
/* ------------------------------------------------------------------ */

export function BarChart({
  data,
  height = 190,
  className,
  highlightMax = true,
}: {
  data: Array<{ label: string; value: number }>
  height?: number
  className?: string
  highlightMax?: boolean
}) {
  const width = 620
  const left = 18
  const right = 8
  const top = 18
  const bottom = 30
  const chartWidth = width - left - right
  const chartHeight = height - top - bottom
  const max = Math.max(...data.map((item) => item.value), 1)
  const barSpace = chartWidth / data.length
  const barWidth = Math.min(30, barSpace * 0.56)
  const maxIndex = data.reduce((best, item, index) => (item.value > data[best].value ? index : best), 0)
  const [active, setActive] = useState<number | null>(null)

  return (
    <div className={cx('relative w-full', className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((ratio) => {
          const y = top + chartHeight - ratio * chartHeight
          return (
            <g key={ratio}>
              <line x1={left} x2={width - right} y1={y} y2={y} stroke="#ECE8DD" strokeWidth="1" strokeDasharray="3 5" />
              <text x={left} y={y - 5} fontSize="9" fill="#9AA093">
                {Math.round(max * ratio)}
              </text>
            </g>
          )
        })}
        {data.map((item, index) => {
          const barHeight = Math.max(3, (item.value / max) * chartHeight)
          const x = left + index * barSpace + (barSpace - barWidth) / 2
          const y = top + chartHeight - barHeight
          const isHighlight = highlightMax && index === maxIndex
          return (
            <g
              key={item.label}
              onMouseEnter={() => setActive(index)}
              onMouseLeave={() => setActive(null)}
              className="cursor-default"
            >
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={5} fill={isHighlight ? '#243B2A' : active === index ? '#7D9463' : '#D8E2CB'} className="transition-colors" />
              <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fontSize="9" fill={isHighlight ? '#4F6B3C' : '#9AA093'}>
                {item.label}
              </text>
            </g>
          )
        })}
      </svg>
      {active !== null ? (
        <div className="pointer-events-none absolute right-2 top-1 rounded-md border border-line bg-white px-2.5 py-1.5 text-[10px] font-semibold text-forest shadow-card">
          {data[active].label}: {data[active].value}
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Donut                                                               */
/* ------------------------------------------------------------------ */

export function Donut({
  segments,
  centerValue,
  centerLabel,
  size = 164,
  strokeWidth = 17,
  className,
}: {
  segments: Array<{ label: string; value: number; color: string }>
  centerValue: string
  centerLabel: string
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let cumulative = 0

  return (
    <div className={cx('relative inline-flex flex-none items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F0EDE4" strokeWidth={strokeWidth} />
        {segments.map((segment) => {
          const dash = (segment.value / total) * circumference
          const offset = -(cumulative / total) * circumference
          cumulative += segment.value
          return (
            <circle
              key={segment.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${Math.max(0, dash - 2)} ${circumference - Math.max(0, dash - 2)}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <strong className="font-display text-[22px] font-semibold leading-none tracking-[-0.04em] text-forest">{centerValue}</strong>
        <span className="mt-1 max-w-[90px] text-[9px] font-medium uppercase leading-tight tracking-[0.1em] text-muted">{centerLabel}</span>
      </div>
    </div>
  )
}
