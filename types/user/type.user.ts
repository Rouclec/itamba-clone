/**
 * V1 admin users list API types.
 */

export interface MultipleQueryParam {
  material_id?: string
  page_size?: number
  page?: number
  admin_id?: string
  user_id?: string
  role?: string
  subscription_type?: string
}

export interface Statistics {
  current_page: number
  page_count: number
  total_items: number
}

export interface UsersList {
  statistics: Statistics
  users: User[]
}

export interface SubscriptionPlan {
  id: string
  duration: number
  plan_name: 'freemium' | 'professional' | 'organization'
  is_trial: boolean
}

export type AccountStatus =
  | 'ACCOUNT_ACTIVATED'
  | 'ACCOUNT_PENDING'
  | 'INVITE_LINK_CANCELED'
  | 'ACCOUNT_DEACTIVATED'
  | 'ACCOUNT_REACTIVATED'

export type PasswordRequestStatus =
  | 'PASSWORD_RESET_REQUESTED'
  | 'PASSWORD_RESET_REJECT'
  | 'PASSWORD_RESET_APPROVED'

export interface UserClaims {
  user_account_status?: AccountStatus
  user_role: string
  created_by: string
  password_request_status?: PasswordRequestStatus
  token_expiry_date: string
}

export interface User {
  id: string
  user_name: string
  email: string
  outbound_email_action_link: string
  user_claims: UserClaims
  photo_url: string
  subscription_plan_id: string
  password: string
  subscription_expiry_date: string
  subscription_plan: SubscriptionPlan
  telephone: string
  country: string
  city: string
  address: string
  profession: string
  created_at: string
  updated_at: string
}

export type PatchAdminUserPayload = {
  user: Pick<User, 'id'> & {
    user_claims: {
      user_role: string
      user_account_status: string
    }
  }
  super_admin_user_id: string
}
