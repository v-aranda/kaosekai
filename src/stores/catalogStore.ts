import { defineStore } from 'pinia';
import { ref } from 'vue';

const STORAGE_KEY = 'kaosekai-flipbook-state';

interface FlipbookState {
  documentId: string;
  page: number;
  timestamp: number;
}

/**
 * Store para gerenciar estado do catálogo de PDFs
 * Persiste documento selecionado e página atual no localStorage
 */
export const useCatalogStore = defineStore('catalog', () => {
  const currentDocumentId = ref<string | null>(null);
  const currentPage = ref(0);

  /**
   * Salva estado atual no localStorage
   */
  const saveState = () => {
    if (currentDocumentId.value) {
      const state: FlipbookState = {
        documentId: currentDocumentId.value,
        page: currentPage.value,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  };

  /**
   * Carrega estado do localStorage
   * @returns Estado salvo ou valores padrão
   */
  const loadState = (): Partial<FlipbookState> => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: FlipbookState = JSON.parse(stored);
        return {
          documentId: state.documentId,
          page: state.page || 0
        };
      }
    } catch (err) {
      console.error('Erro ao carregar estado do catálogo:', err);
    }
    return { documentId: null, page: 0 };
  };

  /**
   * Define documento atual e salva
   */
  const setDocument = (documentId: string) => {
    currentDocumentId.value = documentId;
    saveState();
  };

  /**
   * Define página atual e salva
   */
  const setPage = (page: number) => {
    currentPage.value = page;
    saveState();
  };

  /**
   * Define documento e página juntos
   */
  const setState = (documentId: string, page: number) => {
    currentDocumentId.value = documentId;
    currentPage.value = page;
    saveState();
  };

  /**
   * Limpa estado
   */
  const clearState = () => {
    currentDocumentId.value = null;
    currentPage.value = 0;
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    // State
    currentDocumentId,
    currentPage,

    // Actions
    setDocument,
    setPage,
    setState,
    saveState,
    loadState,
    clearState
  };
});
