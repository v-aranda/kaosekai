<script setup lang="ts">
import { onMounted, ref, provide, watch } from 'vue';
import { useAuthStore } from './stores/authStore';
import { useCharacterStore } from './stores/characterStore';

// Componentes Principais
import MainSheet from './views/CharacterSheetView.vue'; 
import LoginView from './views/LoginView.vue';
import MyCharactersView from './views/MyCharactersView.vue';
import CatalogView from './views/CatalogView.vue';

// Componentes de Utils
import ToastNotification from './components/Utils/ToastNotification.vue';
import ConfirmDialog from './components/Utils/ConfirmDialog.vue';
import GlobalLoader from './components/Utils/GlobalLoader.vue';
import ExpandableNavItem from './components/Navigation/ExpandableNavItem.vue';
import AdminView from './views/AdminView.vue'; 

const authStore = useAuthStore();
const charStore = useCharacterStore();

// --- Lógica de Toast Centralizada ---
const toastRef = ref<InstanceType<typeof ToastNotification> | null>(null);

const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
  if (toastRef.value) {
    toastRef.value.show(msg, type);
  } else {
    console.warn('Toast ref não encontrada');
  }
};

provide('notify', triggerToast);

// --- Navegação ---
const currentView = ref<'HOME' | 'SHEET' | 'ADMIN' | 'CATALOG'>('HOME');
const adminSubtopic = ref('users');

const navigateTo = (view: 'HOME' | 'SHEET' | 'ADMIN' | 'CATALOG', subtopic?: string) => {
  if (view === 'ADMIN') {
    charStore.closeSheet(); // Garante que a ficha feche
    adminSubtopic.value = subtopic || 'users';
  } else if (view === 'HOME') {
    charStore.closeSheet();
  }
  // Se for SHEET, o charStore trata isso selecionando um char
  currentView.value = view;
};

// Se o charStore tiver um ID, forçamos a view de SHEET
// Mas precisamos cuidar para que se o usuário clicar em Admin, o ID seja limpo, ou a view tenha prioridade.
// O App atual usava `charStore.dbId` para decidir entre MainSheet e MyCharacters.
// Vou alterar a lógica no template para respeitar `currentView` OU `charStore.dbId`.

// Monitorar charStore.dbId para mudar view automaticamente ao selecionar char
watch(() => charStore.dbId, (newId) => {
  if (newId) currentView.value = 'SHEET';
  else if (currentView.value === 'SHEET') currentView.value = 'HOME';
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
            @click="navigateTo('CATALOG')" 
            class="dock-item" 
            :class="{ active: currentView === 'CATALOG' }"
            title="Catálogo de PDFs"
          >
            <v-icon name="hi-solid-book-open" scale="1.1" />
          </button>

          <button 
            @click="toggleTheme" 
            class="dock-item" 
            :title="currentTheme === 'dark' ? 'Modo Claro' : 'Modo Escuro'"
          >
            <v-icon :name="currentTheme === 'dark' ? 'hi-solid-sun' : 'hi-solid-moon'" scale="1.1" />
          </button>

          <div class="dock-separator"></div>

          <!-- ADMIN TAB - agora próximo do logout -->
          <ExpandableNavItem 
            v-if="authStore.user?.role === 'ADMIN'"
            icon="gi-checked-shield" 
            label="Admin"
            :isActive="currentView === 'ADMIN'"
            :subItems="[
              { label: 'Usuários', action: () => navigateTo('ADMIN', 'users') },
              { label: 'Documentos', action: () => navigateTo('ADMIN', 'documents') }
            ]"
          />

          <div v-if="authStore.user?.role === 'ADMIN'" class="dock-separator"></div>

          <button 
            @click="authStore.logout()" 
            class="dock-item logout" 
            title="Sair"
          >
            <v-icon name="gi-exit-door" scale="1.1" />
          </button>
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
        <AdminView v-else-if="currentView === 'ADMIN'" :currentSubtopic="adminSubtopic" />
        <CatalogView v-else-if="currentView === 'CATALOG'" />
        <MyCharactersView v-else />
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

  &:hover {
    transform: scale(1.15);
    background: var(--bg-app);
    color: var(--color-accent);
  }

  &.logout:hover {
    color: var(--color-error);
    background: rgba(255, 0, 0, 0.1);
  }
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
    padding: 20px;
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