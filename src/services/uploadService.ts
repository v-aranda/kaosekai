// src/services/uploadService.ts
import api from './api';

type UploadResponse = {
  url?: string;
  path?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
};

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await api.post<UploadResponse>('/uploads/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { url, path } = response.data;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
  const finalUrl = url?.startsWith('http') ? url : `${base}${path || url}`;

  if (!finalUrl) {
    throw new Error('Falha no upload da imagem');
  }

  return finalUrl;
}