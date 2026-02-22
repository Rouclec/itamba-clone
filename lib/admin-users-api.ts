/**
 * Admin users: v1 list + patch (role/deactivate), v2 invite/resend/cancel.
 */

import axiosInstance from '@/utils/inteceptor'
import {
  userServiceInviteAdmin,
  userServiceResendAdminInvitation,
  userServiceCancelAdminInvitation,
} from '@/@hey_api/users.swagger'
import type { v2AdminRole } from '@/@hey_api/users.swagger'
import type {
  MultipleQueryParam,
  UsersList,
  User,
  PatchAdminUserPayload,
} from '@/types/user/type.user'

const buildListParams = (query: Required<Pick<MultipleQueryParam, 'page' | 'page_size' | 'admin_id' | 'role'>>) =>
  `page=${query.page}&page_size=${query.page_size}&admin_id=${query.admin_id}&role=${query.role}`

export async function getAllUsers(
  query: Required<Pick<MultipleQueryParam, 'page' | 'page_size' | 'admin_id' | 'role'>> & {
    subscription_type?: string
  }
): Promise<UsersList> {
  const base = buildListParams(query)
  const suffix = query.subscription_type != null && query.subscription_type !== ''
    ? `&subscription_type=${encodeURIComponent(query.subscription_type)}`
    : ''
  const { data } = await axiosInstance.get<UsersList>(`/users?${base}${suffix}`)
  return data ?? { statistics: { current_page: 1, page_count: 1, total_items: 0 }, users: [] }
}

export async function patchAdminUser(payload: PatchAdminUserPayload): Promise<void> {
  await axiosInstance.patch('/admin/users/accounts', payload.user)
}

export type UpdateAdminRolePayload = {
  user: Pick<User, 'id'> & { user_claims: { user_role: string } }
  super_admin_user_id: string
}

export async function updateAdminUserRole(payload: UpdateAdminRolePayload): Promise<void> {
  await axiosInstance.patch(
    `/admin/users/claims?user_id=${encodeURIComponent(payload.super_admin_user_id)}`,
    payload.user
  )
}

/** v2: invite a new admin (actorId = current admin, email + role). */
export async function inviteAdmin(params: {
  actorUserId: string
  actorName?: string
  email: string
  role: v2AdminRole
}): Promise<void> {
  await userServiceInviteAdmin({
    path: { userId: params.actorUserId },
    body: {
      email: params.email,
      role: params.role,
      createdBy: params.actorName ?? undefined,
    },
  })
}

/** v2: resend invitation to a pending admin. */
export async function resendAdminInvitation(params: {
  actorUserId: string
  actorName?: string
  email: string
  role?: v2AdminRole
}): Promise<void> {
  await userServiceResendAdminInvitation({
    path: { userId: params.actorUserId },
    body: {
      email: params.email,
      role: params.role,
      resentBy: params.actorName ?? undefined,
    },
  })
}

/** v2: cancel a pending admin invitation. */
export async function cancelAdminInvitation(params: {
  actorUserId: string
  email: string
  canceledBy?: string
}): Promise<void> {
  await userServiceCancelAdminInvitation({
    path: { userId: params.actorUserId },
    body: {
      email: params.email,
      canceledBy: params.canceledBy ?? undefined,
    },
  })
}
