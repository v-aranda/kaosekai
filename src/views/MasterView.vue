<script setup lang="ts">
import { defineProps, ref, computed, onMounted } from 'vue';
import { useUiStore } from '../stores/uiStore';
import { listParties, createParty, updateParty, deletePartyRequest, type PartyResponse, type PartyType } from '../services/partyService';
import { uploadImage } from '../services/uploadService';

defineProps<{
  currentSubtopic: string;
}>();

interface Party {
  id: number;
  name: string;
  description: string;
  banner: string;
  type: PartyType;
  members: number;
}

const partys = ref<Party[]>([]);

const ui = useUiStore();

const searchQuery = ref('');
const showCreateDialog = ref(false);
const newParty = ref({
  name: '',
  description: '',
  banner: '',
  type: 'PUBLIC' as 'PUBLIC' | 'PRIVATE'
});
const bannerPreview = ref<string>('');
const bannerFileUrl = ref<string>('');
const bannerFile = ref<File | null>(null);
const editingParty = ref<Party | null>(null);
const isEditing = computed(() => editingParty.value !== null);
const fallbackBanner = 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400&h=120&fit=crop';

const filteredPartys = computed(() => {
  if (!searchQuery.value.trim()) return partys.value;
  
  const query = searchQuery.value.toLowerCase();
  return partys.value.filter(party => 
    party.name.toLowerCase().includes(query) || 
    party.description.toLowerCase().includes(query)
  );
});

const openCreateDialog = () => {
  editingParty.value = null;
  resetForm();
  showCreateDialog.value = true;
};

const onEditParty = (party: Party) => {
  editingParty.value = party;
  newParty.value = {
    name: party.name,
    description: party.description,
    banner: party.banner,
    type: party.type
  };
  bannerPreview.value = party.banner;
  bannerFile.value = null;
  if (bannerFileUrl.value) {
    URL.revokeObjectURL(bannerFileUrl.value);
    bannerFileUrl.value = '';
  }
  showCreateDialog.value = true;
};

const closeCreateDialog = () => {
  showCreateDialog.value = false;
  resetForm();
};

const resetForm = () => {
  newParty.value = {
    name: '',
    description: '',
    banner: '',
    type: 'PUBLIC'
  };
  if (bannerFileUrl.value) {
    URL.revokeObjectURL(bannerFileUrl.value);
  }
  bannerFileUrl.value = '';
  bannerPreview.value = '';
  bannerFile.value = null;
};

const onBannerSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  if (bannerFileUrl.value) {
    URL.revokeObjectURL(bannerFileUrl.value);
  }

  const objectUrl = URL.createObjectURL(file);
  bannerFileUrl.value = objectUrl;
  bannerPreview.value = objectUrl;
  newParty.value.banner = objectUrl;
  bannerFile.value = file;
};

const mapApiParty = (p: PartyResponse): Party => ({
  id: p.id,
  name: p.name,
  description: p.description,
  banner: p.banner ?? fallbackBanner,
  type: p.type,
  members: p.members_count ?? 0,
});

const loadParties = async () => {
  try {
    const data = await listParties();
    partys.value = data.map(mapApiParty);
  } catch (error) {
    console.error('Erro ao carregar partys', error);
  }
};

const saveParty = async () => {
  if (!newParty.value.name.trim() || !newParty.value.description.trim()) {
    alert('Nome e descrição são obrigatórios!');
    return;
  }

  try {
    let bannerUrl: string | null = newParty.value.banner || null;

    if (bannerFile.value) {
      bannerUrl = await uploadImage(bannerFile.value);
    }

    if (editingParty.value) {
      const updated = await updateParty(editingParty.value.id, {
        name: newParty.value.name,
        description: newParty.value.description,
        banner: bannerUrl ?? editingParty.value.banner,
        type: newParty.value.type,
      });
      partys.value = partys.value.map((p) =>
        p.id === editingParty.value?.id ? mapApiParty(updated) : p
      );
    } else {
      const created = await createParty({
        name: newParty.value.name,
        description: newParty.value.description,
        banner: bannerUrl ?? fallbackBanner,
        type: newParty.value.type,
      });
      partys.value.unshift(mapApiParty(created));
    }

    closeCreateDialog();
  } catch (error) {
    console.error('Erro ao salvar party', error);
  }
};

const deleteParty = async (id: number) => {
  const party = partys.value.find(p => p.id === id);
  const confirmed = await ui.confirm(
    'Excluir party',
    `Tem certeza que deseja excluir "${party?.name ?? 'esta party'}"?`
  );
  if (!confirmed) return;
  try {
    await deletePartyRequest(id);
    partys.value = partys.value.filter(p => p.id !== id);
  } catch (error) {
    console.error('Erro ao excluir party', error);
  }
};

onMounted(() => {
  loadParties();
});
</script>

<template>
  <div class="master-view">
    <div class="master-header">
      <h1>Área do Mestre</h1>
    </div>
    
    <div v-if="currentSubtopic === 'partys'" class="master-content">
      <div class="content-header">
        <h2>Gerenciar Partys</h2>
        <button class="btn-create" @click="openCreateDialog">
          <v-icon name="hi-solid-plus" />
          <span>Criar Nova Party</span>
        </button>
      </div>

      <div class="search-bar">
        <v-icon name="hi-solid-search" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Buscar partys..."
        />
      </div>

      <div class="partys-list">
        <div v-if="filteredPartys.length === 0" class="empty-state">
          <p>Nenhuma party encontrada.</p>
        </div>
        <div v-else v-for="party in filteredPartys" :key="party.id" class="party-card">
          <div class="party-banner">
            <img :src="party.banner" :alt="party.name" />
            <span class="party-type" :class="party.type.toLowerCase()">
              {{ party.type === 'PUBLIC' ? 'Pública' : 'Privada' }}
            </span>
          </div>
          
          <div class="party-info">
            <div class="party-main">
              <h3>{{ party.name }}</h3>
              <p>{{ party.description }}</p>
            </div>
            
            <div class="party-meta">
              <div class="party-members">
                <v-icon name="gi-three-friends" />
                <span>{{ party.members }} membros</span>
              </div>
              
              <div class="party-actions">
                <button class="btn-icon" title="Editar" @click="onEditParty(party)">
                  <v-icon name="gi-gears" />
                </button>
                <button class="btn-icon danger" title="Excluir" @click="deleteParty(party.id)">
                  <v-icon name="fa-trash" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Party Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h2>{{ isEditing ? 'Editar Party' : 'Criar Nova Party' }}</h2>
          <button class="close-btn" @click="closeCreateDialog">×</button>
        </div>

        <form @submit.prevent="saveParty" class="dialog-form">
          <div class="form-group">
            <label>Nome da Party *</label>
            <input 
              v-model="newParty.name" 
              type="text" 
              placeholder="Ex: Aventureiros do Norte"
              required
            />
          </div>

          <div class="form-group">
            <label>Descrição *</label>
            <textarea 
              v-model="newParty.description" 
              rows="4"
              placeholder="Descreva o objetivo e estilo da party..."
              required
            ></textarea>
          </div>

          <div class="form-group">
            <label>Banner da Party</label>
            <div class="banner-upload">
              <label class="upload-btn">
                <input type="file" accept="image/*" @change="onBannerSelected" />
                <v-icon name="fa-images" />
                <span>Enviar imagem</span>
              </label>
              <div v-if="bannerPreview" class="banner-preview">
                <img :src="bannerPreview" alt="Prévia do banner" />
              </div>
              <small>Recomendado: proporção panorâmica (ex: 4:1)</small>
            </div>
          </div>

          <div class="form-group">
            <label>Tipo de Party *</label>
            <select v-model="newParty.type">
              <option value="PUBLIC">Pública</option>
              <option value="PRIVATE">Privada</option>
            </select>
            <small>Escolha quem pode acessar: pública (aberta) ou privada (por convite)</small>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-secondary" @click="closeCreateDialog">
              Cancelar
            </button>
            <button type="submit" class="btn-primary">
              {{ isEditing ? 'Salvar Alterações' : 'Criar Party' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.master-view {
  padding: 20px;
  width: 100%;
  max-width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.master-header {
  margin-bottom: 24px;
}

.master-header h1 {
  color: var(--text-main);
  font-size: 1.8rem;
  margin: 0;
}

.master-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.content-header h2 {
  color: var(--text-main);
  font-size: 1.3rem;
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 0.95rem;
  outline: none;
}

.search-bar input::placeholder {
  color: var(--text-secondary);
}

.partys-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
}

.party-card {
  display: flex;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  max-width: 100%;
  flex-shrink: 0;
}

.party-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.party-banner {
  position: relative;
  width: 240px;
  min-width: 240px;
  height: 140px;
  overflow: hidden;
}

.party-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.party-type {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.party-type.public {
  background: rgba(34, 197, 94, 0.9);
  color: white;
}

.party-type.private {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.party-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 12px;
}

.party-main {
  flex: 1;
}

.party-main h3 {
  color: var(--text-main);
  font-size: 1.1rem;
  margin: 0 0 8px 0;
}

.party-main p {
  color: var(--text-primary);
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
}

.party-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.party-members {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.party-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border-color: var(--color-accent);
}

.btn-icon.danger:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.empty-state {
  padding: 60px 20px;
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
}

.empty-state p {
  margin: 0;
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dialog-content {
  background: var(--bg-card);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-main);
}

.dialog-header h2 {
  margin: 0;
  color: var(--text-main);
  font-size: 1.3rem;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 2rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--color-accent);
}

.dialog-form {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  color: var(--text-main);
  font-weight: 600;
  font-size: 0.9rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-accent);
}

.form-group small {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.banner-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px dashed var(--border-main);
  border-radius: 10px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  width: fit-content;
}

.upload-btn input {
  display: none;
}

.upload-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.banner-preview {
  width: 100%;
  max-height: 140px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-main);
}

.banner-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-main);
}

.btn-secondary:hover {
  background: var(--bg-app);
}

@media (max-width: 768px) {
  .party-card {
    flex-direction: column;
  }

  .party-banner {
    width: 100%;
    height: 160px;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }
}
</style>
