'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useT } from '@/app/i18n/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ADMIN_ROLES } from '@/hooks/use-admin-users'
import type { v2AdminRole } from '@/@hey_api/users.swagger'

type InviteAdminModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (params: { email: string; role: v2AdminRole }) => Promise<void>
}

export function InviteAdminModal({
  open,
  onOpenChange,
  onSubmit,
}: InviteAdminModalProps) {
  const { t } = useT('translation')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<v2AdminRole | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setEmail('')
      setRole('')
      setError(null)
    }
  }, [open])

  const getErrorMessage = (err: unknown): string => {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    return typeof msg === 'string' ? msg : t('auth.errorOccurred')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setError(t('validation.emailRequired'))
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setError(t('validation.invalidEmail'))
      return
    }
    if (!role || role === 'ADMIN_ROLE_UNSPECIFIED') {
      setError(t('validation.selectRole'))
      return
    }
    setSubmitting(true)
    try {
      await onSubmit({ email: trimmed, role: role as v2AdminRole })
      onOpenChange(false)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('admin.users.inviteModalTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t('admin.users.inviteEmailLabel')}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              placeholder={t('admin.users.inviteEmailPlaceholder')}
              className={error ? 'border-destructive' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">{t('admin.users.inviteRoleLabel')}</Label>
            <Select
              value={role || undefined}
              onValueChange={(v) => {
                setRole(v as v2AdminRole)
                setError(null)
              }}
            >
              <SelectTrigger id="invite-role" className="w-full">
                <SelectValue placeholder={t('admin.users.inviteRoleLabel')} />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {t(r.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('admin.users.cancel')}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin shrink-0" />
                  {t('common.loading')}
                </>
              ) : (
                t('admin.users.inviteAdmin')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
