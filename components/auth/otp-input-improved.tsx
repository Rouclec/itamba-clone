'use client'

import React, { useEffect, useRef } from 'react'

interface OTPInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  error?: boolean
}

export function OTPInputImproved({
  length = 6,
  value,
  onChange,
  onComplete,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  const handleChange = (index: number, digit: string) => {
    // Only allow digits
    if (!/^\d*$/.test(digit)) return
    if (digit.length > 1) return

    const newValue = value.split('')
    newValue[index] = digit
    const result = newValue.join('')
    onChange(result.slice(0, length))

    // Auto-advance to next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Trigger onComplete when all digits are filled
    if (result.length === length && onComplete) {
      onComplete(result)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')
    const digits = pastedData.replace(/\D/g, '').slice(0, length)
    
    if (digits.length === length) {
      onChange(digits)
      inputRefs.current[length - 1]?.focus()
      if (onComplete) {
        onComplete(digits)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2 md:gap-3">
        {Array.from({ length }).map((_, index) => (
          <input
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
            className={`w-[48px] h-[48px] md:w-[56px] md:h-[56px] text-center text-lg md:text-xl border rounded-lg transition-colors ${
              error
                ? 'border-destructive bg-red-50 text-destructive'
                : value[index]
                ? 'border-primary bg-blue-50 text-primary'
                : 'border-(--input-border) bg-input text-foreground focus:border-primary focus:ring-1 focus:ring-primary'
            } outline-none`}
          />
        ))}
      </div>
    </div>
  )
}
