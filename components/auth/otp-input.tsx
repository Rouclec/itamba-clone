'use client'

import { useRef, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  error?: boolean
}

export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value)
    }
  }, [value, length, onComplete])

  const handleChange = (index: number, val: string) => {
    // Only allow digits
    if (!/^\d*$/.test(val)) return

    const newValue = value.split('')
    newValue[index] = val
    const result = newValue.join('')

    // Only keep the required length
    onChange(result.slice(0, length))

    // Auto-focus next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Focus previous input if current is empty
        inputRefs.current[index - 1]?.focus()
      } else if (value[index]) {
        // Clear current input
        const newValue = value.split('')
        newValue[index] = ''
        onChange(newValue.join(''))
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '')
    if (pastedData) {
      const newValue = (pastedData + value).slice(0, length)
      onChange(newValue)
      
      // Focus the appropriate input
      const nextIndex = Math.min(newValue.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <div className="flex gap-2 justify-center" onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}>
      {Array.from({ length }).map((_, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder="0"
          className={cn(
            'w-12 h-12 text-center text-lg font-semibold transition-all',
            'border border-[var(--input-border)] rounded-lg',
            'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
            error && 'border-destructive focus-visible:ring-destructive/20',
            isFocused && !error && 'border-primary',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
        />
      ))}
    </div>
  )
}
