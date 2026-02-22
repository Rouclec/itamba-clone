import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { v2AdminRole } from '@/@hey_api/users.swagger'
import type { User } from '@/types/user/type.user'
import {
  getAllUsers,
  patchAdminUser,
  updateAdminUserRole,
  inviteAdmin,
  resendAdminInvitation,
  cancelAdminInvitation,
  type UpdateAdminRolePayload,
} from '@/lib/admin-users-api'

export const ADMIN_USERS_QUERY_KEY = 'admin-users'

const defaultListParams = {
  page: 1,
  page_size: 10,
  role: 'admin' as const,
}

export function useGetAdminUsers(
  adminId: string | null,
  page = 1,
  pageSize = 10
) {
  return useQuery({
    queryKey: [ADMIN_USERS_QUERY_KEY, adminId, page, pageSize],
    queryFn: () =>
      getAllUsers({
        ...defaultListParams,
        page,
        page_size: pageSize,
        admin_id: adminId!,
      }),
    enabled: !!adminId,
  })
}

export function useInviteAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inviteAdmin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
    },
  })
}

export function useResendAdminInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resendAdminInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
    },
  })
}

export function useCancelAdminInvitation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: cancelAdminInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
    },
  })
}

export function useDeactivateAdmin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: { user: Pick<User, 'id'> & { user_claims: { user_role: string; user_account_status: string } }; super_admin_user_id: string }) =>
      patchAdminUser({ user: payload.user, super_admin_user_id: payload.super_admin_user_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
    },
  })
}

export function useUpdateAdminRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAdminRolePayload) => updateAdminUserRole(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
    },
  })
}

/** Admin roles for dropdown (exclude UNSPECIFIED). */
export const ADMIN_ROLES: { value: v2AdminRole; labelKey: string }[] = [
  { value: 'ADMIN_ROLE_SUPER_ADMIN', labelKey: 'admin.users.roles.superAdmin' },
  {
    value: 'ADMIN_ROLE_LIBRARY_ADMINISTRATOR',
    labelKey: 'admin.users.roles.libraryAdministrator',
  },
  {
    value: 'ADMIN_ROLE_DOCUMENTS_MANAGER',
    labelKey: 'admin.users.roles.documentsManager',
  },
  {
    value: 'ADMIN_ROLE_DOCUMENTS_EDITOR',
    labelKey: 'admin.users.roles.documentsEditor',
  },
  {
    value: 'ADMIN_ROLE_DOCUMENTS_WRITER',
    labelKey: 'admin.users.roles.documentsWriter',
  },
  {
    value: 'ADMIN_ROLE_CUSTOMERS_ADMINISTRATOR',
    labelKey: 'admin.users.roles.customersAdministrator',
  },
  {
    value: 'ADMIN_ROLE_ACCOUNTS_MANAGER',
    labelKey: 'admin.users.roles.accountsManager',
  },
]
