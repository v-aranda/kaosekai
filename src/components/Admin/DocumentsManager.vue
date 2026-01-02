<template>
  <div class="documents-manager">
    <div class="documents-header">
      <h2>Gerenciamento de Documentos</h2>
      <button class="btn-primary" @click="showAddDialog = true">
        <span>➕</span> Adicionar Documento
      </button>
    </div>

    <div class="documents-list">
      <div v-if="loading" class="loading">Carregando documentos...</div>
      
      <div v-else-if="documents.length === 0" class="empty-state">
        Nenhum documento cadastrado ainda.
      </div>

      <div v-else class="documents-grid">
        <div 
          v-for="doc in documents" 
          :key="doc.id" 
          class="document-card"
          :class="{ 'is-wip': doc.isWip }"
        >
          <div class="document-cover">
            <img :src="getFullUrl(doc.coverImage)" :alt="doc.name" />
            <span v-if="doc.isWip" class="wip-badge">WIP</span>
          </div>
          <div class="document-info">
            <h3>{{ doc.name }}</h3>
            <p class="version">Versão {{ doc.version }}</p>
            <div class="document-actions">
              <button @click="editDocument(doc)" class="btn-edit">Editar</button>
              <button @click="confirmDelete(doc)" class="btn-delete">
                <v-icon name="fa-trash" scale="1" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog para adicionar/editar documento -->
    <div v-if="showAddDialog || editingDoc" class="modal-overlay" @click.self="closeDialog">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ editingDoc ? 'Editar Documento' : 'Novo Documento' }}</h3>
          <button @click="closeDialog" class="btn-close">✕</button>
        </div>
        
        <form @submit.prevent="saveDocument" class="modal-body document-form">
          <div class="form-group">
            <label>Nome do Documento *</label>
            <input 
              v-model="formData.name" 
              type="text" 
              required 
              placeholder="Ex: Manual do Jogador"
            />
          </div>

          <div class="form-group">
            <label>Versão *</label>
            <input 
              v-model="formData.version" 
              type="text" 
              required 
              placeholder="Ex: 1.0, beta, alpha"
            />
          </div>

          <div class="form-group">
            <label>Imagem de Capa *</label>
            <input 
              type="file" 
              accept="image/*" 
              @change="handleCoverChange"
              :required="!editingDoc"
            />
            <div v-if="coverPreview" class="preview">
              <img :src="coverPreview" alt="Preview" />
            </div>
          </div>

          <div class="form-group">
            <label>Arquivo PDF *</label>
            <input 
              type="file" 
              accept="application/pdf" 
              @change="handlePdfChange"
              :required="!editingDoc"
            />
            <div v-if="formData.pdfFile && !editingDoc" class="file-info">
              Arquivo selecionado: {{ formData.pdfFile.name }}
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label>
              <input type="checkbox" v-model="formData.isWip" />
              <span>Marcar como WIP (Work in Progress)</span>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeDialog" class="btn-ghost">
              Cancelar
            </button>
            <button type="submit" class="btn-primary" :disabled="uploading">
              {{ uploading ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { Document } from '../../types';
import { listAdminDocuments, createDocument as apiCreateDocument, updateDocument as apiUpdateDocument, deleteDocument as apiDeleteDocument } from '../../services/documentsService';
import { useUiStore } from '../../stores/uiStore';

const documents = ref<Document[]>([]);
const loading = ref(false);
const showAddDialog = ref(false);
const editingDoc = ref<Document | null>(null);
const uploading = ref(false);
const uiStore = useUiStore();

const formData = ref({
  name: '',
  version: '',
  coverImage: null as File | null,
  pdfFile: null as File | null,
  isWip: false
});

const coverPreview = ref('');

const getFullUrl = (path: string) => {
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/api$/, '');
  return `${base}${path}`;
};

const loadDocuments = async () => {
  loading.value = true;
  try {
    documents.value = await listAdminDocuments();
  } catch (error) {
    console.error('Erro ao carregar documentos:', error);
    alert('Erro ao carregar documentos');
  } finally {
    loading.value = false;
  }
};

const handleCoverChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    formData.value.coverImage = file;
    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      coverPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

const handlePdfChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    formData.value.pdfFile = file;
  }
};

const saveDocument = async () => {
  uploading.value = true;
  
  try {
    const data = new FormData();
    data.append('name', formData.value.name);
    data.append('version', formData.value.version);
    data.append('isWip', formData.value.isWip.toString());
    
    if (formData.value.coverImage) {
      data.append('coverImage', formData.value.coverImage);
    }
    if (formData.value.pdfFile) {
      data.append('pdfFile', formData.value.pdfFile);
    }

    if (editingDoc.value) {
      await apiUpdateDocument(editingDoc.value.id, data);
    } else {
      await apiCreateDocument(data);
    }

    await loadDocuments();
    closeDialog();
  } catch (error: any) {
    console.error('Erro ao salvar documento:', error);
    alert(error.response?.data?.message || 'Erro ao salvar documento');
  } finally {
    uploading.value = false;
  }
};

const editDocument = (doc: Document) => {
  editingDoc.value = doc;
  formData.value.name = doc.name;
  formData.value.version = doc.version;
  formData.value.isWip = doc.isWip;
  coverPreview.value = getFullUrl(doc.coverImage);
};

const deleteDocument = async (doc: Document) => {
  try {
    await apiDeleteDocument(doc.id);
    await loadDocuments();
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    alert('Erro ao excluir documento');
  }
};

const confirmDelete = async (doc: Document) => {
  const confirmed = await uiStore.confirm(
    'Excluir Documento',
    `Tem certeza que deseja excluir ${doc.name}? Essa ação não pode ser desfeita.`
  );
  if (confirmed) {
    await deleteDocument(doc);
  }
};

const closeDialog = () => {
  showAddDialog.value = false;
  editingDoc.value = null;
  formData.value = {
    name: '',
    version: '',
    coverImage: null,
    pdfFile: null,
    isWip: false
  };
  coverPreview.value = '';
};

onMounted(() => {
  loadDocuments();
});
</script>

<style scoped lang="scss">
.documents-manager {
  padding: 2rem;
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  h2 {
    font-size: 1.8rem;
    color: var(--text-primary);
  }
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.document-card {
  background: var(--bg-secondary);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-4px);
  }

  &.is-wip {
    border: 2px solid var(--color-warning, #f59e0b);
  }
}

.document-cover {
  position: relative;
  width: 100%;
  padding-top: 141.4%; // Proporção A4
  background: var(--bg-tertiary);

  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .wip-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: var(--color-warning, #f59e0b);
    color: white;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: bold;
  }
}

.document-info {
  padding: 1rem;

  h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
  }

  .version {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }
}

.document-actions {
  display: flex;
  gap: 0.5rem;

  button {
    flex: 1;
    padding: 0.5rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.875rem;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .btn-edit {
    background: var(--color-accent, #00cccc);
    color: var(--text-on-light, #000);
    border: 1px solid var(--border-color);
  }

  .btn-delete {
    background: var(--color-danger, #ef4444);
    color: #fff;
    border: 1px solid transparent;
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-card {
  background: var(--bg-card, #222222);
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 16px 60px rgba(0, 0, 0, 0.25);

  &.danger {
    border: 2px solid var(--color-danger, #ef4444);
    h3 {
      color: var(--color-danger, #ef4444);
    }
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);

  h3 {
    font-size: 1.35rem;
    color: var(--text-primary);
  }

  .btn-close {
    background: none;
    border: none;
    font-size: 1.3rem;
    cursor: pointer;
    color: var(--text-secondary);

    &:hover {
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: 1.25rem 1.5rem 0;
}

.document-form {
  padding-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-weight: 500;
  }

  input[type="text"],
  input[type="file"] {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-primary);
    font-size: 1rem;

    &:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(0, 204, 204, 0.2);
    }
  }
}

.checkbox-group {
  label {
    display: flex;
    align-items: center;
    cursor: pointer;

    input[type="checkbox"] {
      margin-right: 0.5rem;
      width: auto;
    }

    span {
      font-weight: normal;
    }
  }
}

.preview {
  margin-top: 1rem;
  
  img {
    max-width: 200px;
    border-radius: 4px;
  }
}

.file-info {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid var(--border-color);
}

.btn-primary,
.btn-secondary,
.btn-ghost,
.btn-danger {
  padding: 0.75rem 1.35rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border: 1px solid var(--border-color);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.btn-ghost {
  background: transparent;
  color: var(--text-primary);
}

.btn-danger {
  background: var(--color-danger, #ef4444);
  color: white;
}

.loading,
.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  font-size: 1.1rem;
}
</style>
