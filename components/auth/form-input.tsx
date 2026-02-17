'use client'

import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  required?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, required = false, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
    
    return (
      <div className="w-full space-y-2">
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        
        <Input
          ref={ref}
          id={inputId}
          className={cn(
            'transition-colors',
            error &&
              'border-2 border-destructive focus-visible:border-destructive focus-visible:ring-1 focus-visible:ring-destructive focus-visible:ring-offset-0',
            className
          )}
          {...props}
        />
        
        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
        
        {hint && !error && (
          <p className="text-sm text-muted-foreground">{hint}</p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'
