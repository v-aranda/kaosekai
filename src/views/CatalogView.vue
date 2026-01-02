<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import type { Document } from '../types';
import { listDocuments, getDocument } from '../services/documentsService';
const documents = ref<Document[]>([]);
const loading = ref(false);
const selectedId = ref<string | null>(null);
const search = ref('');
const isPanelOpen = ref(false);
const pdfUrl = ref('');


const STORAGE_KEY = 'kaosekai-pdf-state';

const filteredDocs = computed(() => {
  const term = search.value.toLowerCase().trim();
  if (!term) return documents.value;
  return documents.value.filter(doc =>
    doc.name.toLowerCase().includes(term) ||
    doc.version.toLowerCase().includes(term)
  );
});

const selectedDoc = computed(() =>
  documents.value.find(d => d.id === selectedId.value) || null
);

const savePdfState = () => {
  if (selectedId.value) {
    const state = {
      documentId: selectedId.value,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
};

const loadPdfState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const state = JSON.parse(stored);
      return { documentId: state.documentId };
    }
  } catch (err) {
    console.error('Erro ao carregar estado do PDF:', err);
  }
  return { documentId: null };
};

// Salva estado quando documento muda
watch(selectedId, () => {
  savePdfState();
});

const getFullUrl = (partial: string) => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
  return `${base}${partial}`;
};

const openDoc = async (id: string) => {
  try {
    loading.value = true;
    const doc = await getDocument(id);
    selectedId.value = doc.id;
    isPanelOpen.value = false;
    pdfUrl.value = getFullUrl(doc.pdfFile);
  } catch (err) {
    console.error('Erro ao abrir documento', err);
    alert('Não foi possível abrir este PDF');
  } finally {
    loading.value = false;
  }
};

const loadDocs = async () => {
  loading.value = true;
  try {
    documents.value = await listDocuments();
    
    // Tenta restaurar documento anterior e sua página
    const { documentId } = loadPdfState();
    if (documents.value.length) {
      if (documentId && documents.value.some(d => d.id === documentId)) {
        selectedId.value = documentId;
        const doc = documents.value.find(d => d.id === documentId)!;
        pdfUrl.value = getFullUrl(doc.pdfFile);
      } else {
        selectedId.value = documents.value[0].id;
        pdfUrl.value = getFullUrl(documents.value[0].pdfFile);
      }
    }
  } catch (err) {
    console.error('Erro ao carregar catálogo', err);
  } finally {
    loading.value = false;
  }
};

onMounted(loadDocs);
</script>

<template>
  <div class="catalog-view">
    <div class="viewer-area">
      <div class="viewer-header">
        <div class="titles">
          <p class="eyebrow">Leitura</p>
          <h1 v-if="selectedDoc">{{ selectedDoc.name }}</h1>
          <p class="subtitle" v-if="selectedDoc">Versão {{ selectedDoc.version }}</p>
          <p class="subtitle" v-else>Selecione um PDF na biblioteca</p>
        </div>
        <div class="viewer-actions">
          <button class="btn-secondary" @click="isPanelOpen = true">
            <v-icon name="hi-solid-book-open" /> Biblioteca
          </button>
          <a v-if="selectedDoc" :href="getFullUrl(selectedDoc.pdfFile)" target="_blank" rel="noopener" class="btn-primary-outline">
            <v-icon name="hi-solid-external-link" /> Nova aba
          </a>
        </div>
      </div>

      <div v-if="selectedDoc && pdfUrl" class="pdf-viewer-container">
        <div class="pdf-page-wrapper">
          <iframe :src="pdfUrl" title="Visualizador de PDF" class="pdf-iframe"></iframe>
        </div>
      </div>
      <div v-else class="empty">Nenhum documento selecionado.</div>
    </div>

    <div class="offcanvas" :class="{ open: isPanelOpen }">
      <div class="offcanvas-header">
        <h3>Biblioteca</h3>
        <button class="btn-close" @click="isPanelOpen = false">✕</button>
      </div>

      <div class="search-box">
        <v-icon name="hi-solid-search" />
        <input v-model="search" type="text" placeholder="Buscar por nome ou versão" />
      </div>

      <div class="doc-list" v-if="!loading && filteredDocs.length">
        <button
          v-for="doc in filteredDocs"
          :key="doc.id"
          class="doc-item"
          :class="{ active: doc.id === selectedId }"
          @click="openDoc(doc.id)"
        >
          <div class="thumb">
            <img :src="getFullUrl(doc.coverImage)" :alt="doc.name" loading="lazy" />
          </div>
          <div class="info">
            <span class="name">{{ doc.name }}</span>
            <span class="version">v{{ doc.version }}</span>
            <span class="date">{{ new Date(doc.updatedAt).toLocaleDateString() }}</span>
          </div>
        </button>
      </div>
      <div v-else-if="loading" class="empty">Carregando catálogo...</div>
      <div v-else class="empty">Nenhum documento publicado.</div>
    </div>

    <div v-if="isPanelOpen" class="offcanvas-backdrop" @click="isPanelOpen = false"></div>
  </div>
</template>

<style scoped lang="scss">
.catalog-view {
  position: relative;
  min-height: 100vh;
  background: var(--bg-app);
  padding: 1.5rem 1.5rem 2rem;
}

.viewer-area {
  background: var(--bg-card);
  border: 2px solid var(--border-main);
  border-radius: 16px;
  box-shadow: 6px 6px 0 var(--border-main);
  padding: 1.5rem;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  .titles {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  h1 {
    margin: 0;
    font-size: 1.8rem;
    color: var(--text-primary);
  }

  .subtitle {
    margin: 0;
    color: var(--text-secondary);
  }
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.viewer-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.btn-secondary,
.btn-primary-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  cursor: pointer;
  font-weight: 700;
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-decoration: none;
}

.btn-primary-outline {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border-color: var(--border-main);
}

.offcanvas {
  position: fixed;
  top: 0;
  right: -380px;
  width: 340px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-card);
  border-left: 2px solid var(--border-main);
  box-shadow: -6px 0 0 var(--border-main);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: right 0.2s ease;
  z-index: 1200;

  &.open {
    right: 0;
  }
}

.offcanvas-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  h3 {
    margin: 0;
    color: var(--text-primary);
  }

  .btn-close {
    background: transparent;
    border: none;
    font-size: 1.2rem;
    color: var(--text-secondary);
    cursor: pointer;
  }
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;

  input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    outline: none;
  }
}

.doc-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.doc-item {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 0.75rem;
  align-items: center;
  padding: 0.65rem;
  border-radius: 12px;
  border: 1px solid var(--border-main);
  background: var(--bg-secondary);
  cursor: pointer;
  text-align: left;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &.active {
    box-shadow: 0 0 0 3px var(--color-accent);
    transform: translateX(-2px);
  }
}

.thumb {
  width: 72px;
  height: 96px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-main);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  .name {
    font-weight: 700;
    color: var(--text-primary);
  }

  .version {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }

  .date {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
}

.offcanvas-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1100;
}

.empty {
  text-align: center;
  color: var(--text-secondary);
  padding: 1rem;
}

@media (max-width: 720px) {
  .viewer-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .pdf-viewer-container {
    height: 65vh;
  }
}

.pdf-viewer-container {
  margin-top: 1rem;
  width: 100%;
  height: min(78vh, 960px);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  overflow: hidden;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.pdf-page-wrapper {
  flex: 1;
  background: #1a1a1a;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #1a1a1a;
}
</style>
