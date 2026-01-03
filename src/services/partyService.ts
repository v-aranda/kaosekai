import api from './api';

export type PartyType = 'PUBLIC' | 'PRIVATE';

export interface PartyResponse {
  id: number;
  owner_id: number;
  name: string;
  description: string;
  banner: string | null;
  type: PartyType;
  members_count: number;
  created_at: string;
  updated_at: string;
}

export async function listParties() {
  const { data } = await api.get<PartyResponse[]>('/parties');
  return data;
}

export async function createParty(payload: {
  name: string;
  description: string;
  banner?: string | null;
  type: PartyType;
}) {
  const { data } = await api.post<PartyResponse>('/parties', payload);
  return data;
}

export async function updateParty(id: number, payload: {
  name?: string;
  description?: string;
  banner?: string | null;
  type?: PartyType;
}) {
  const { data } = await api.put<PartyResponse>(`/parties/${id}`, payload);
  return data;
}

export async function deletePartyRequest(id: number) {
  await api.delete(`/parties/${id}`);
}
