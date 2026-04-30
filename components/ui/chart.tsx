'use client'

import * as React from 'react'
import * as RechartsPrimitive from 'recharts'
import { cn } from '@/lib/utils/cn'

/**
 * Lean chart wrapper for Recharts.
 * Exports: ChartContainer, ChartTooltip, ChartTooltipContent.
 *
 * `config` lets charts declare per-series colors/labels. Each key becomes
 * a CSS custom property --color-<key> scoped to the container, so charts
 * can reference `fill="var(--color-<key>)"` cleanly.
 */

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    color?: string
  }
}

type ChartContextProps = { config: ChartConfig }
const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const ctx = React.useContext(ChartContext)
  if (!ctx) throw new Error('useChart must be used within a <ChartContainer />')
  return ctx
}

interface ChartContainerProps extends React.ComponentProps<'div'> {
  config:   ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children']
}

function ChartContainer({ id, className, children, config, ...props }: ChartContainerProps) {
  const uniqueId = React.useId()
  const chartId  = `chart-${(id ?? uniqueId).replace(/:/g, '')}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex justify-center text-xs w-full h-full",
          "[&_.recharts-cartesian-axis-tick_text]:fill-[var(--color-text-muted)]",
          "[&_.recharts-cartesian-grid_line]:stroke-[var(--color-border)]/60",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-[var(--color-border)]/60",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-[var(--color-border)]",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-[var(--color-surface-muted)]/60",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-surface]:outline-none",
          "[&_.recharts-layer]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const entries = Object.entries(config).filter(([, v]) => v.color)
  if (entries.length === 0) return null

  const body = entries
    .map(([key, v]) => `  --color-${key}: ${v.color};`)
    .join('\n')

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `[data-chart=${id}] {\n${body}\n}`,
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

// Recharts passes tooltip props (active, payload, label, formatters) to the
// `content` render prop — we accept them loosely via `unknown[]` so the local
// props layer (indicator, nameKey, …) can be authored cleanly without colliding
// with the multiple incompatible overloads inside the Recharts type surface.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TooltipPayloadItem = any

interface ChartTooltipContentProps {
  active?:         boolean
  payload?:        TooltipPayloadItem[]
  label?:          React.ReactNode
  labelFormatter?: (value: React.ReactNode, payload: TooltipPayloadItem[]) => React.ReactNode
  labelClassName?: string
  formatter?:      (
    value:   TooltipPayloadItem,
    name:    TooltipPayloadItem,
    item:    TooltipPayloadItem,
    index:   number,
    payload: TooltipPayloadItem
  ) => React.ReactNode
  className?:      string
  hideLabel?:      boolean
  hideIndicator?:  boolean
  indicator?:      'line' | 'dot' | 'dashed'
  nameKey?:        string
  labelKey?:       string
  valueFormatter?: (value: number | string) => string
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  nameKey,
  labelKey,
  valueFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart()

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) return null
    const [item] = payload
    const key  = `${labelKey || item?.dataKey || item?.name || 'value'}`
    const cfg  = getConfigEntry(config, item, key)
    const value =
      !labelKey && typeof label === 'string'
        ? (config[label as keyof typeof config]?.label ?? label)
        : cfg?.label

    if (labelFormatter) {
      return <div className={cn('font-semibold text-[var(--color-text-primary)]', labelClassName)}>{labelFormatter(value, payload)}</div>
    }
    if (!value) return null
    return <div className={cn('font-semibold text-[var(--color-text-primary)]', labelClassName)}>{value}</div>
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

  if (!active || !payload?.length) return null

  const nestLabel = payload.length === 1 && indicator !== 'dot'

  return (
    <div
      className={cn(
        'grid min-w-[9rem] items-start gap-1.5 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-[var(--shadow-md)]',
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`
          const cfg = getConfigEntry(config, item, key)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const color = (item as any).color || (item.payload as any)?.fill
          const formattedValue =
            valueFormatter && (typeof item.value === 'number' || typeof item.value === 'string')
              ? valueFormatter(item.value)
              : typeof item.value === 'number'
                ? item.value.toLocaleString()
                : item.value

          return (
            <div
              key={String(item.dataKey) + index}
              className={cn(
                'flex w-full flex-wrap items-stretch gap-2',
                indicator === 'dot' && 'items-center'
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {!hideIndicator && (
                    <div
                      className={cn('shrink-0 rounded-[2px]', {
                        'h-2.5 w-2.5': indicator === 'dot',
                        'w-1':          indicator === 'line',
                        'w-0 border-[1.5px] border-dashed bg-transparent': indicator === 'dashed',
                        'my-0.5':       nestLabel && indicator === 'dashed',
                      })}
                      style={{ backgroundColor: color, borderColor: color }}
                    />
                  )}
                  <div className={cn('flex flex-1 justify-between leading-none', nestLabel ? 'items-end' : 'items-center')}>
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-[var(--color-text-muted)]">
                        {cfg?.label ?? item.name}
                      </span>
                    </div>
                    {item.value !== undefined && (
                      <span className="ml-3 font-semibold tabular-nums text-[var(--color-text-primary)]">
                        {formattedValue}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function getConfigEntry(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) return undefined
  const payloadPayload =
    'payload' in payload && typeof (payload as { payload?: unknown }).payload === 'object'
      ? (payload as { payload: Record<string, unknown> }).payload
      : undefined

  let configKey: string = key
  if (key in payload && typeof (payload as Record<string, unknown>)[key] === 'string') {
    configKey = (payload as Record<string, string>)[key]
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === 'string') {
    configKey = payloadPayload[key] as string
  }
  return configKey in config ? config[configKey] : config[key]
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
