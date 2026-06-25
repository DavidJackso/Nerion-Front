import { apiClient } from '~/utils/apiClient'

export interface InviteInfo {
  space_id: number
  space_name: string
  email: string
}

export const getInvite = (token: string): Promise<InviteInfo> =>
  apiClient.get(`/invites/${token}`)

export const acceptInvite = (token: string): Promise<{ message: string }> =>
  apiClient.post(`/invites/${token}/accept`, {})
