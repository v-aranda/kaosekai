import api from './api';

export interface PostUser {
  id: number;
  name: string;
  avatar: string | null;
}

export interface PostResponse {
  id: number;
  party_id: number;
  user_id: number;
  text: string;
  images: string[];
  user: PostUser;
  created_at: string;
  updated_at: string;
}

export async function listPostsByParty(partyId: number, silent = false) {
  const { data } = await api.get<PostResponse[]>(`/parties/${partyId}/posts`, {
    headers: silent ? { 'X-Silent-Request': 'true' } : {}
  });
  return data;
}

export async function createPost(partyId: number, payload: {
  text: string;
  images?: string[];
}) {
  const { data } = await api.post<PostResponse>(`/parties/${partyId}/posts`, payload);
  return data;
}

export async function deletePost(postId: number) {
  await api.delete(`/posts/${postId}`);
}
