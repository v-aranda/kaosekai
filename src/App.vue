<script setup lang="ts">
import { onMounted, ref, provide, watch, computed } from 'vue';
import type { User } from './types';
import { useAuthStore } from './stores/authStore';
import { useCharacterStore } from './stores/characterStore';
import { setToastRef } from './composables/useToast';

// Componentes Principais
import MainSheet from './views/CharacterSheetView.vue'; 
import LoginView from './views/LoginView.vue';
import MyCharactersView from './views/MyCharactersView.vue';
import CatalogView from './views/CatalogView.vue';
import HomeView from './views/HomeView.vue';
import ProfileView from './views/ProfileView.vue';

// Componentes de Utils
import ToastNotification from './components/Utils/ToastNotification.vue';
import ConfirmDialog from './components/Utils/ConfirmDialog.vue';
import GlobalLoader from './components/Utils/GlobalLoader.vue';
import ExpandableNavItem from './components/Navigation/ExpandableNavItem.vue';
import AdminView from './views/AdminView.vue';
import MasterView from './views/MasterView.vue'; 

const authStore = useAuthStore();
const charStore = useCharacterStore();
const profileTargetUser = ref<User | null>(null);
const showUserMenu = ref(false);

// --- Lógica de Toast Centralizada ---
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null);

watch(() => toastRef.value, (newVal) => {
  if (newVal) {
    setToastRef(toastRef);
  }
}, { immediate: true });

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  if (toastRef.value) {
    toastRef.value.show(msg, type);
  } else {
    console.warn('Toast ref não encontrada');
  }
};

provide('notify', triggerToast);
provide('profileTargetUser', profileTargetUser);

// --- Navegação ---
const currentView = ref<'HOME' | 'MYCHARS' | 'SHEET' | 'ADMIN' | 'MASTER' | 'CATALOG' | 'PROFILE'>('HOME');
const adminSubtopic = ref('users');
const masterSubtopic = ref('partys');
const lastView = ref<'HOME' | 'MYCHARS' | 'SHEET' | 'ADMIN' | 'MASTER' | 'CATALOG'>('HOME');

const navigateTo = (view: 'HOME' | 'MYCHARS' | 'SHEET' | 'ADMIN' | 'MASTER' | 'CATALOG' | 'PROFILE', subtopic?: string) => {
  if (view === 'ADMIN') {
    charStore.closeSheet(); // Garante que a ficha feche
    adminSubtopic.value = subtopic || 'users';
  } else if (view === 'MASTER') {
    charStore.closeSheet();
    masterSubtopic.value = subtopic || 'partys';
  } else if (view === 'HOME' || view === 'MYCHARS' || view === 'PROFILE') {
    charStore.closeSheet();
  }
  if (view !== 'PROFILE') {
    lastView.value = view;
  }
  // Se for SHEET, o charStore trata isso selecionando um char
  currentView.value = view;
};

const openProfileForUser = (user: User | null) => {
  profileTargetUser.value = user;
  navigateTo('PROFILE');
};

provide('openProfileForUser', openProfileForUser);
provide('closeProfileDialog', () => navigateTo(lastView.value));

const openOwnProfile = () => {
  profileTargetUser.value = null;
  navigateTo('PROFILE');
};

const avatarUrl = computed(() => authStore.user?.avatar || '');
const userInitial = computed(() => (authStore.user?.name?.[0]?.toUpperCase() || '?'));

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value;
};

const closeUserMenu = () => {
  showUserMenu.value = false;
};

// Se o charStore tiver um ID, forçamos a view de SHEET
// Mas precisamos cuidar para que se o usuário clicar em Admin, o ID seja limpo, ou a view tenha prioridade.
// O App atual usava `charStore.dbId` para decidir entre MainSheet e MyCharacters.
// Vou alterar a lógica no template para respeitar `currentView` OU `charStore.dbId`.

// Monitorar charStore.dbId para mudar view automaticamente ao selecionar char
watch(() => charStore.dbId, (newId) => {
  if (newId) currentView.value = 'SHEET';
  else if (currentView.value === 'SHEET') currentView.value = 'MYCHARS';
});


// --- Lógica de Tema ---
const currentTheme = ref('light');

const toggleTheme = () => {
    const root = document.documentElement;
    currentTheme.value = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', currentTheme.value);
    localStorage.setItem('kaosekai-theme', currentTheme.value);
}

// --- Inicialização ---
onMounted(() => {
  const savedTheme = localStorage.getItem('kaosekai-theme') || 'light';
  currentTheme.value = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  if (authStore.token) {
    charStore.fetchList();
  }
});
</script>

<template>
  <div class="app-root">
    
    <GlobalLoader /> 
    <ConfirmDialog />
    <ToastNotification ref="toastRef" />

    <LoginView v-if="!authStore.token" />

    <div v-else class="authenticated-layout">
      
      <aside class="side-dock-container">
        <div class="dock-wrapper">
          <button 
            @click="navigateTo('HOME')" 
            class="dock-item" 
            :class="{ active: currentView === 'HOME' }"
            title="Início"
          >
            <v-icon name="hi-solid-home" scale="1.1" />
          </button>

          <div class="dock-separator"></div>

          <button 
            @click="navigateTo('MYCHARS')" 
            class="dock-item" 
            :class="{ active: currentView === 'MYCHARS' }"
            title="Fichas"
          >
            <v-icon name="gi-newspaper" scale="1.1" />
          </button>

          <button 
            @click="navigateTo('CATALOG')" 
            class="dock-item" 
            :class="{ active: currentView === 'CATALOG' }"
            title="Catálogo de PDFs"
          >
            <v-icon name="gi-bookshelf" scale="1.1" />
          </button>

          <button 
            @click="toggleTheme" 
            class="dock-item" 
            :title="currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'"
          >
            <v-icon :name="currentTheme === 'dark' ? 'hi-solid-sun' : 'hi-solid-moon'" scale="1.1" />
          </button>

          <div class="dock-separator"></div>

          <!-- MASTER TAB -->
          <ExpandableNavItem 
            v-if="authStore.user?.role === 'MASTER' || authStore.user?.role === 'ADMIN'"
            icon="gi-chess-king" 
            label="Área do Mestre"
            :isActive="currentView === 'MASTER'"
            :subItems="[
              { label: 'Partys', action: () => navigateTo('MASTER', 'partys') }
            ]"
          />

          <!-- ADMIN TAB - agora próximo do logout -->
          <ExpandableNavItem 
            v-if="authStore.user?.role === 'ADMIN'"
            icon="gi-gears" 
            label="Admin"
            :isActive="currentView === 'ADMIN'"
            :subItems="[
              { label: 'Usuários', action: () => navigateTo('ADMIN', 'users') },
              { label: 'Documentos', action: () => navigateTo('ADMIN', 'documents') }
            ]"
          />

          <div v-if="authStore.user?.role === 'ADMIN'" class="dock-separator"></div>

          <div class="user-menu">
            <button 
              @click="toggleUserMenu" 
              class="dock-item avatar-button" 
              :class="{ active: currentView === 'PROFILE', open: showUserMenu }"
              title="Perfil"
            >
              <div class="avatar-thumb">
                <img v-if="avatarUrl" :src="avatarUrl" alt="avatar" />
                <span v-else>{{ userInitial }}</span>
              </div>
            </button>
            <div v-if="showUserMenu" class="user-menu-panel">
              <div class="user-menu-header">Perfil</div>
              <button @click="openOwnProfile(); closeUserMenu()">Editar Perfil</button>
              <button class="logout" @click="authStore.logout(); closeUserMenu()">Logout</button>
            </div>
          </div>
        </div>

        <div v-if="charStore.dbId" class="dock-status-vertical">
          <div v-if="charStore.isSaving" class="status-icon saving" title="Salvando...">
            <v-icon name="fa-spinner" animation="spin" scale="0.9" />
          </div>
          <div v-else class="status-icon saved" title="Salvo">
            <v-icon name="fa-save" scale="0.9" />
          </div>
        </div>
      </aside>

      <main class="app-content">
        <MainSheet v-if="currentView === 'SHEET' && charStore.dbId" />
        <MasterView v-else-if="currentView === 'MASTER'" :currentSubtopic="masterSubtopic" />
        <AdminView v-else-if="currentView === 'ADMIN'" :currentSubtopic="adminSubtopic" />
        <CatalogView v-else-if="currentView === 'CATALOG'" />
        <ProfileView v-else-if="currentView === 'PROFILE'" />
        <MyCharactersView v-else-if="currentView === 'MYCHARS'" />
        <HomeView v-else />
      </main>
      
    </div>
  </div>
</template>

<style lang="scss">
.app-root { 
    min-height: 100vh; 
    display: flex; 
    flex-direction: column; 
}

.authenticated-layout { 
    display: flex; 
    flex-direction: row; // Alinha Dock e Conteúdo lado a lado
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

/* ESTILOS DA DOCK VERTICAL */
.side-dock-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start; // Centraliza a dock verticalmente na tela
  padding: 25px 25px;
  gap: 15px;
  z-index: 1000;
  background: transparent;
}

.dock-wrapper {
  background: var(--bg-card);
  border: 2px solid var(--border-main);
  border-radius: 30px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column; // Itens um embaixo do outro
  align-items: center;
  gap: 12px;
  box-shadow: 4px 4px 0px var(--border-main);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 6px 6px 0px var(--border-main);
  }
}

.dock-item {
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 2.5em;

  &:hover {
    transform: scale(1.15);
    background: var(--bg-app);
    color: var(--color-accent);
  }

  &.logout:hover {
    color: var(--color-error);
    background: rgba(255, 0, 0, 0.1);
  }

  &.active {
    font-size: 2.7em;
  }
}

.user-menu {
  position: relative;
  display: flex;
  justify-content: center;
}

.avatar-button {
  padding: 0;
}

.avatar-thumb {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid var(--border-main);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  font-weight: 700;
  color: var(--text-secondary);
}

.avatar-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-menu-panel {
  position: absolute;
  top: 50%;
  left: 60px; /* projeta para a direita da navbar */
  transform: translateY(-50%);
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 10px;
  box-shadow: 4px 4px 0 var(--border-main);
  display: flex;
  flex-direction: column;
  min-width: 170px;
  z-index: 1200;
}

.user-menu-header {
  padding: 10px 12px;
  font-weight: 700;
  border-bottom: 1px solid var(--border-main);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-menu-panel button {
  background: transparent;
  border: none;
  padding: 10px 12px;
  text-align: left;
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
}

.user-menu-panel button:hover {
  background: rgba(255, 255, 255, 0.06);
}

.user-menu-panel .logout {
  color: var(--color-error);
}

.dock-separator {
  width: 15px;
  height: 2px;
  background: var(--border-main);
  opacity: 0.2;
}

/* STATUS ICON ABAIXO DA DOCK */
.dock-status-vertical {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 35px;
  height: 35px;
  background: var(--bg-card);
  border: 2px solid var(--border-main);
  border-radius: 50%;
  box-shadow: 3px 3px 0px var(--border-main);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.saving { color: var(--color-warning); }
.saved { color: var(--color-success); }

/* CONTEÚDO PRINCIPAL */
.app-content { 
    flex: 1; 
    padding: 0;
    overflow-y: auto; 
    background: var(--bg-app);
    height: 100vh;
}

/* Ajuste para telas pequenas */
@media (max-width: 600px) {
  .authenticated-layout {
    flex-direction: column;
  }
  .side-dock-container {
    flex-direction: row;
    width: 100%;
    height: auto;
    padding: 10px;
    justify-content: center;
  }
  .dock-wrapper {
    flex-direction: row;
  }
  .dock-status-vertical {
    margin-left: 10px;
  }
}
</style>