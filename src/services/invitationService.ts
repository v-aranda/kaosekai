import api from './api';

export interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  avatar?: string | null;
}

export const searchUsers = async (query: string): Promise<UserSearchResult[]> => {
  const { data } = await api.get<UserSearchResult[]>(`/users/search?query=${encodeURIComponent(query)}`);
  return data;
};

export const inviteUserToParty = async (partyId: number, userId: number): Promise<void> => {
  await api.post(`/parties/${partyId}/invitations`, { userId });
};
