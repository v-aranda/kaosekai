import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Document } from '../types';
import { listDocuments, listAdminDocuments, createDocument, updateDocument, deleteDocument } from '../services/documentsService';

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<Document[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDocuments(includeWip = false) {
    try {
      isLoading.value = true;
      documents.value = includeWip ? await listAdminDocuments() : await listDocuments();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao carregar documentos';
    } finally {
      isLoading.value = false;
    }
  }

  async function addDocument(formData: FormData) {
    try {
      isLoading.value = true;
      const doc = await createDocument(formData);
      documents.value.unshift(doc);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao criar documento';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function editDocument(id: string, formData: FormData) {
    try {
      isLoading.value = true;
      const doc = await updateDocument(id, formData);
      documents.value = documents.value.map(d => d.id === doc.id ? doc : d);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao atualizar documento';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function removeDocument(id: string) {
    try {
      isLoading.value = true;
      await deleteDocument(id);
      documents.value = documents.value.filter(d => d.id !== id);
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Erro ao deletar documento';
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  return { documents, isLoading, error, fetchDocuments, addDocument, editDocument, removeDocument };
});
