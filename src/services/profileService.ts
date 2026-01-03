import api from './api';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  password?: string;
  avatar?: string;
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await api.patch('/user/profile', payload);
  return data;
}
