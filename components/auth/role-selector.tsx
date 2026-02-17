'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Role {
  id: string
  label: string
}

interface RoleSelectorProps {
  roles: Role[]
  value?: string
  onChange: (roleId: string) => void
  disabled?: boolean
  columns?: number
}

const defaultRoles: Role[] = [
  { id: 'student', label: 'Student' },
  { id: 'employed', label: 'Employed' },
  { id: 'self-employed', label: 'Self employed' },
  { id: 'job-seeker', label: 'Job seeker' },
  { id: 'business-man', label: 'Business man' },
  { id: 'other', label: 'Other' },
]

export function RoleSelector({
  roles = defaultRoles,
  value,
  onChange,
  disabled = false,
  columns = 3,
}: RoleSelectorProps) {
  return (
    <div className={cn(
      'grid gap-3',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'md:grid-cols-3 grid-cols-2',
      columns === 6 && 'md:grid-cols-3 grid-cols-2',
    )}>
      {roles.map((role) => (
        <Button
          key={role.id}
          type="button"
          variant={value === role.id ? 'default' : 'outline'}
          onClick={() => onChange(role.id)}
          disabled={disabled}
          className={cn(
            'py-1 px-2 h-auto transition-all border-0',
            value === role.id
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 border-primary'
              : 'bg-surface text-foreground border-border hover:border-primary hover:text-primary',
          )}
        >
          <span className="text-sm font-medium">{role.label}</span>
        </Button>
      ))}
    </div>
  )
}
