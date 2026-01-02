import api from './api';
import type { Document } from '../types';

// Público
export async function listDocuments() {
  const response = await api.get('/documents');
  return response.data as Document[];
}

export async function getDocument(id: string) {
  const response = await api.get(`/documents/${id}`);
  return response.data as Document;
}

// Admin
export async function listAdminDocuments() {
  const response = await api.get('/admin/documents');
  return response.data as Document[];
}

export async function createDocument(formData: FormData) {
  const response = await api.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as Document;
}

export async function updateDocument(id: string, formData: FormData) {
  const response = await api.put(`/documents/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data as Document;
}

export async function deleteDocument(id: string) {
  await api.delete(`/documents/${id}`);
}
