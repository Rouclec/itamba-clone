'use client'

import { useState } from 'react'
import {
  Plus,
  Mail,
  XCircle,
  UserX,
  UserPlus,
  Loader2,
  MoreHorizontal,
} from 'lucide-react'
import { useT } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  useGetAdminUsers,
  useInviteAdmin,
  useResendAdminInvitation,
  useCancelAdminInvitation,
  useDeactivateAdmin,
  useUpdateAdminRole,
  ADMIN_ROLES,
} from '@/hooks/use-admin-users'
import type { User } from '@/types/user/type.user'
import { InviteAdminModal } from '@/components/admin/invite-admin-modal'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const PAGE_SIZE = 10

function getPaginationSlots(
  page: number,
  totalPages: number,
  maxVisible?: number
): (number | 'ellipsis')[] {
  const limit = maxVisible ?? 7
  if (totalPages <= limit) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }
  if (page >= totalPages - 2) {
    return [1, 2, 3, 'ellipsis', totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages]
}

/** Fallback when no translation key: strip ACCOUNT_ prefix, title case. */
function formatStatusDisplay(status: string | undefined): string {
  if (!status || !status.trim()) return '—'
  let s = status.trim()
  if (s.toUpperCase().startsWith('ACCOUNT_')) {
    s = s.slice(8)
  }
  const titleCased = s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  if (titleCased === 'Activated') return 'Active'
  return titleCased
}

/** Map backend status to i18n key (admin.users.statusX). Includes US and UK spellings. */
const STATUS_I18N_KEYS: Record<string, string> = {
  ACCOUNT_ACTIVATED: 'admin.users.statusActive',
  ACCOUNT_REACTIVATED: 'admin.users.statusReactivated',
  ACCOUNT_PENDING: 'admin.users.statusPending',
  ACCOUNT_DEACTIVATED: 'admin.users.statusDeactivated',
  INVITE_LINK_CANCELED: 'admin.users.statusInviteCanceled',
  INVITE_CANCELED: 'admin.users.statusInviteCanceled',
  INVITE_LINK_CANCELLED: 'admin.users.statusInviteCanceled',
  INVITE_CANCELLED: 'admin.users.statusInviteCanceled',
  PENDING_VERIFICATION: 'admin.users.statusPendingVerification',
  ACTIVE: 'admin.users.statusActive',
  SUSPENDED: 'admin.users.statusSuspended',
  BANNED: 'admin.users.statusBanned',
  DEACTIVATED: 'admin.users.statusDeactivated',
  REACTIVATED: 'admin.users.statusReactivated',
  PENDING: 'admin.users.statusPending',
}

/** Translated status label; falls back to formatStatusDisplay for unknown statuses. */
function getStatusDisplayLabel(
  status: string | undefined,
  t: (key: string) => string
): string {
  if (!status?.trim()) return '—'
  const key = STATUS_I18N_KEYS[status.trim().toUpperCase()]
  if (key) return t(key)
  return formatStatusDisplay(status)
}

/** Normalize backend role code to ADMIN_ROLE_* for matching. */
function normalizeRoleCode(roleCode: string): string {
  const upper = roleCode.trim().toUpperCase().replace(/\s+/g, '_')
  if (upper.startsWith('ADMIN_ROLE_')) return upper
  return `ADMIN_ROLE_${upper}`
}

/** Return ADMIN_ROLES value when backend role matches (so Select and display stay in sync). */
function getNormalizedRoleValue(roleCode: string | undefined): string {
  if (!roleCode?.trim()) return ''
  const normalized = normalizeRoleCode(roleCode)
  const found = ADMIN_ROLES.find(
    (r) =>
      r.value === roleCode ||
      r.value.toUpperCase() === roleCode!.trim().toUpperCase() ||
      r.value.toUpperCase() === normalized
  )
  return found ? found.value : roleCode.trim()
}

/** Display label for a role code (translated if in ADMIN_ROLES, else title-cased). */
function getRoleDisplayLabel(
  roleCode: string | undefined,
  t: (key: string) => string
): string {
  if (!roleCode?.trim()) return '—'
  const normalized = normalizeRoleCode(roleCode)
  const found = ADMIN_ROLES.find(
    (r) =>
      r.value === roleCode ||
      r.value.toUpperCase() === roleCode!.trim().toUpperCase() ||
      r.value.toUpperCase() === normalized
  )
  if (found) return t(found.labelKey)
  return formatStatusDisplay(roleCode)
}

export default function AdminUsersPage() {
  const { t } = useT('translation')
  const { userId, currentUser } = useAuth()
  const actorId = userId ?? currentUser?.userId ?? ''
  const actorName = currentUser?.fullName ?? undefined

  const [page, setPage] = useState(1)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [reactivateTarget, setReactivateTarget] = useState<User | null>(null)
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: User
    newRole: string
  } | null>(null)

  const { data, isLoading } = useGetAdminUsers(actorId, page, PAGE_SIZE)
  const inviteMutation = useInviteAdmin()
  const resendMutation = useResendAdminInvitation()
  const cancelMutation = useCancelAdminInvitation()
  const deactivateMutation = useDeactivateAdmin()
  const updateRoleMutation = useUpdateAdminRole()

  const admins = data?.users ?? []
  const totalItems = data?.statistics?.total_items ?? 0
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const isMobile = useIsMobile()

  const handleInviteSubmit = async (params: { email: string; role: import('@/@hey_api/users.swagger').v2AdminRole }) => {
    await inviteMutation.mutateAsync({
      actorUserId: actorId,
      actorName,
      email: params.email,
      role: params.role,
    })
  }

  const handleResend = (user: User) => {
    resendMutation.mutate(
      {
        actorUserId: actorId,
        actorName,
        email: user.email,
        role: (user.user_claims?.user_role as import('@/@hey_api/users.swagger').v2AdminRole) || undefined,
      },
      {
        onSuccess: () => toast.success(t('admin.users.actionResendInvite')),
        onError: () => toast.error(t('auth.errorOccurred')),
      }
    )
  }

  const handleCancelInvite = (user: User) => {
    cancelMutation.mutate(
      {
        actorUserId: actorId,
        email: user.email,
        canceledBy: actorName,
      },
      {
        onSuccess: () => toast.success(t('admin.users.actionCancelInvite')),
        onError: () => toast.error(t('auth.errorOccurred')),
      }
    )
  }

  const getErrorMessage = (err: unknown): string => {
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
    return typeof msg === 'string' ? msg : t('auth.errorOccurred')
  }

  const handleConfirmDeactivate = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!deactivateTarget) return
    deactivateMutation.mutate(
      {
        user: {
          id: deactivateTarget.id,
          user_claims: {
            user_role: deactivateTarget.user_claims?.user_role ?? '',
            user_account_status: 'ACCOUNT_DEACTIVATED',
          },
        },
        super_admin_user_id: actorId,
      },
      {
        onSuccess: () => {
          toast.success(t('admin.users.actionSuspend'))
          setDeactivateTarget(null)
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    )
  }

  const handleConfirmReactivate = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!reactivateTarget) return
    deactivateMutation.mutate(
      {
        user: {
          id: reactivateTarget.id,
          user_claims: {
            user_role: reactivateTarget.user_claims?.user_role ?? '',
            user_account_status: 'ACCOUNT_ACTIVATED',
          },
        },
        super_admin_user_id: actorId,
      },
      {
        onSuccess: () => {
          toast.success(t('admin.users.actionReactivate'))
          setReactivateTarget(null)
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    )
  }

  const handleConfirmRoleChange = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!roleChangeTarget) return
    updateRoleMutation.mutate(
      {
        user: {
          id: roleChangeTarget.user.id,
          user_claims: { user_role: roleChangeTarget.newRole },
        },
        super_admin_user_id: actorId,
      },
      {
        onSuccess: () => {
          toast.success(t('admin.users.confirmSwitchRoleTitle'))
          setRoleChangeTarget(null)
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    )
  }

  const handleRoleSelect = (user: User, newRole: string) => {
    const currentRole = user.user_claims?.user_role ?? ''
    if (newRole === currentRole) return
    setRoleChangeTarget({ user, newRole })
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-col overflow-x-hidden overflow-y-auto">
      <div className="min-h-0 min-w-0 flex-1 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {t('admin.users.title')}
            </h1>
            <p className="text-body-text font-normal">
              {t('admin.users.subtitle')}
            </p>
          </div>
          <Button
            className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto w-full"
            onClick={() => setInviteOpen(true)}
          >
            <Plus className="size-4" />
            {t('admin.users.inviteAdmin')}
          </Button>
        </div>

        <div className="min-w-0 overflow-x-auto rounded-lg border border-border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-surface">
                <TableHead className="min-w-[220px] font-bold p-4">
                  {t('admin.users.name')}
                </TableHead>
                <TableHead className="min-w-[180px] font-bold p-4">
                  {t('admin.users.role')}
                </TableHead>
                <TableHead className="min-w-[120px] font-bold p-4">
                  {t('admin.users.status')}
                </TableHead>
                <TableHead className="font-bold p-4 text-right min-w-[100px]">
                  {t('admin.users.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center py-8"
                  >
                    {t('common.loading')}
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-muted-foreground text-center py-8"
                  >
                    {t('admin.users.noAdmins')}
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((user, index) => {
                  const status = user.user_claims?.user_account_status
                  const isPending = status === 'ACCOUNT_PENDING'
                  const isInviteCanceled =
                    status === 'INVITE_LINK_CANCELED' ||
                    status === 'INVITE_CANCELED' ||
                    (typeof status === 'string' &&
                      status.toUpperCase().includes('INVITE') &&
                      status.toUpperCase().includes('CANCEL'))
                  const canResendInvite = isPending || isInviteCanceled
                  const isActive =
                    status === 'ACCOUNT_ACTIVATED' || status === 'ACCOUNT_REACTIVATED'
                  const isDeactivated = status === 'ACCOUNT_DEACTIVATED'
                  const displayName = user.user_name?.trim() || user.email
                  const showEmailAsSecondary = !!user.user_name?.trim()

                  return (
                    <TableRow
                      key={user.id}
                      className={cn(
                        index % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'
                      )}
                    >
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 shrink-0">
                            {user.photo_url ? (
                              <AvatarImage
                                src={user.photo_url}
                                alt=""
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback className="text-xs bg-muted">
                              {(user.user_name || user.email || '?')
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {displayName}
                            </div>
                            {showEmailAsSecondary && (
                              <div className="text-muted-foreground text-sm truncate">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Select
                          value={getNormalizedRoleValue(user.user_claims?.user_role) || undefined}
                          onValueChange={(v) => handleRoleSelect(user, v)}
                        >
                          <SelectTrigger
                            className="w-full max-w-[200px] border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted/50 data-[slot=select-value]:font-medium"
                            size="sm"
                          >
                            <SelectValue>
                              {getRoleDisplayLabel(
                                user.user_claims?.user_role,
                                t
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {ADMIN_ROLES.map((r) => (
                              <SelectItem key={r.value} value={r.value}>
                                {t(r.labelKey)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {getStatusDisplayLabel(status, t)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <TooltipProvider delayDuration={0}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label={t('admin.users.actions')}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canResendInvite && (
                                <DropdownMenuItem
                                  onClick={() => handleResend(user)}
                                  disabled={resendMutation.isPending}
                                >
                                  <Mail className="size-4 mr-2" />
                                  {t('admin.users.actionResendInvite')}
                                </DropdownMenuItem>
                              )}
                              {isPending && (
                                <DropdownMenuItem
                                  onClick={() => handleCancelInvite(user)}
                                  disabled={cancelMutation.isPending}
                                  className="text-destructive focus:text-destructive [&_svg]:text-destructive"
                                >
                                  <XCircle className="size-4 mr-2" />
                                  {t('admin.users.actionCancelInvite')}
                                </DropdownMenuItem>
                              )}
                              {isActive && (
                                <DropdownMenuItem
                                  onClick={() => setDeactivateTarget(user)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <UserX className="size-4 mr-2" />
                                  {t('admin.users.actionSuspend')}
                                </DropdownMenuItem>
                              )}
                              {isDeactivated && (
                                <DropdownMenuItem
                                  onClick={() => setReactivateTarget(user)}
                                >
                                  <UserPlus className="size-4 mr-2" />
                                  {t('admin.users.actionReactivate')}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-end **:data-[slot=pagination-link]:font-normal">
          <Pagination className="w-full justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage((p) => p - 1)
                  }}
                  aria-disabled={page <= 1}
                  className={cn(page <= 1 && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
              {getPaginationSlots(
                page,
                totalPages,
                isMobile ? 4 : 7
              ).map((slot, index) =>
                slot === 'ellipsis' ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <span className="px-2">…</span>
                  </PaginationItem>
                ) : (
                  <PaginationItem key={slot}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setPage(slot)
                      }}
                      isActive={page === slot}
                    >
                      {slot}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage((p) => p + 1)
                  }}
                  aria-disabled={page >= totalPages}
                  className={cn(
                    page >= totalPages && 'pointer-events-none opacity-50'
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      <InviteAdminModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSubmit={handleInviteSubmit}
      />

      <AlertDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.users.confirmDeactivateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.users.confirmDeactivateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeactivateTarget(null)}
              disabled={deactivateMutation.isPending}
            >
              {t('admin.users.cancel')}
            </AlertDialogCancel>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('admin.users.actionSuspend')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!reactivateTarget}
        onOpenChange={(open) => {
          if (!open) setReactivateTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.users.confirmReactivateTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.users.confirmReactivateDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setReactivateTarget(null)}
              disabled={deactivateMutation.isPending}
            >
              {t('admin.users.cancel')}
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmReactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('admin.users.actionReactivate')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!roleChangeTarget}
        onOpenChange={(open) => {
          if (!open) setRoleChangeTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('admin.users.confirmSwitchRoleTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <span className="block">
                {roleChangeTarget && (
                  <>
                    {t('admin.users.confirmSwitchRoleBeforeName')}
                    <strong>
                      {roleChangeTarget.user.user_name?.trim() ||
                        roleChangeTarget.user.email}
                    </strong>
                    {t('admin.users.confirmSwitchRoleAfterName')}
                    <strong>
                      {getRoleDisplayLabel(
                        roleChangeTarget.user.user_claims?.user_role,
                        t
                      )}
                    </strong>
                    {t('admin.users.confirmSwitchRoleAfterOldRole')}
                    <strong>
                      {getRoleDisplayLabel(roleChangeTarget.newRole, t)}
                    </strong>
                  </>
                )}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRoleChangeTarget(null)}
              disabled={updateRoleMutation.isPending}
            >
              {t('admin.users.cancel')}
            </AlertDialogCancel>
            <Button
              onClick={handleConfirmRoleChange}
              disabled={updateRoleMutation.isPending}
            >
              {updateRoleMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                t('admin.users.confirm')
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
