'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface MultiSelectOption {
  id: string
  label: string
}

export interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  /** Max labels to show on trigger before "+ N more" */
  maxShow?: number
  className?: string
  triggerClassName?: string
  disabled?: boolean
  id?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  maxShow = 3,
  className,
  triggerClassName,
  disabled,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter((o) => value.includes(o.id))
  const toggle = (id: string) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    )
  }

  const triggerLabel = React.useMemo(() => {
    if (selectedOptions.length === 0) return placeholder
    if (selectedOptions.length <= maxShow) {
      return selectedOptions.map((o) => o.label).join(', ')
    }
    return `${selectedOptions.slice(0, maxShow).map((o) => o.label).join(', ')} +${selectedOptions.length - maxShow} more`
  }, [selectedOptions, placeholder, maxShow])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          disabled={disabled}
          className={cn(
            'w-full justify-between text-left font-normal truncate',
            !value.length && 'text-muted-foreground',
            triggerClassName
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'w-[var(--radix-popover-trigger-width)] max-w-[min(100vw-2rem,520px)] p-0',
          className
        )}
        align="start"
        onWheelCapture={(e) => {
          const el = scrollRef.current
          if (!el || !el.contains(e.target as Node)) return
          const { scrollTop, scrollHeight, clientHeight } = el
          const maxScroll = scrollHeight - clientHeight
          if (maxScroll <= 0) return
          const canScrollUp = scrollTop > 0
          const canScrollDown = scrollTop < maxScroll
          if (e.deltaY < 0 && canScrollUp) {
            el.scrollTop = Math.max(0, el.scrollTop + e.deltaY)
            e.preventDefault()
            e.stopPropagation()
          } else if (e.deltaY > 0 && canScrollDown) {
            el.scrollTop = Math.min(maxScroll, el.scrollTop + e.deltaY)
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        <div
          ref={scrollRef}
          className="h-[280px] overflow-y-auto overscroll-contain sm:h-[400px]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <ul
            role="listbox"
            aria-multiselectable
            className="p-1"
          >
            {options.map((opt) => (
              <li key={opt.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted/50'
                  )}
                >
                  <Checkbox
                    checked={value.includes(opt.id)}
                    onCheckedChange={() => toggle(opt.id)}
                    aria-label={opt.label}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="min-w-0 break-words whitespace-normal">
                    {opt.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  )
}
