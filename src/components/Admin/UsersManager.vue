
<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import { useAdminStore } from '../../stores/adminStore';
import { useUiStore } from '../../stores/uiStore';
import type { User } from '../../types';
import type { Header, Item } from "vue3-easy-data-table";

const adminStore = useAdminStore();
const uiStore = useUiStore();
const notify = inject('notify') as (msg: string, type?: 'success' | 'error') => void;

// --- Estado do Modal ---
const showModal = ref(false);
const isEditing = ref(false);
const editingId = ref<number | null>(null);

const form = ref({
  name: '',
  email: '',
    role: 'PLAYER' as 'ADMIN' | 'GM' | 'PLAYER',
  password: '' // Somente para criação ou reset
});

// --- Configuração da Tabela ---
const searchQuery = ref('');

const headers: Header[] = [
  { text: "ID", value: "id", sortable: true },
  { text: "NOME", value: "name", sortable: true },
  { text: "EMAIL", value: "email", sortable: true },
  { text: "FUNÇÃO", value: "role", sortable: true },
  { text: "AÇÕES", value: "actions" },
];

// Mapeia usuários para itens da tabela (embora o objeto já seja compatível, 
// é bom para garantir estrutura se mudar no futuro)
const items = computed(() => {
    return adminStore.users;
});


// --- Carregamento Inicial ---
onMounted(() => {
  adminStore.fetchUsers();
});

// --- Ações ---

const openCreateModal = () => {
    isEditing.value = false;
    editingId.value = null;
    form.value = { name: '', email: '', role: 'PLAYER', password: '' };
    showModal.value = true;
};

const openEditModal = (user: User) => {
    isEditing.value = true;
    editingId.value = user.id;
    // Copia dados
    form.value = { 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        password: '' // Senha vazia ao editar (não alterar se não preencher)
    };
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const saveUser = async () => {
    if (!form.value.name || !form.value.email) {
        notify('Preencha nome e email', 'error');
        return;
    }

    if (!isEditing.value && !form.value.password) {
        notify('Defina uma senha para o novo usuário', 'error');
        return;
    }

    if (isEditing.value && editingId.value) {
        const payload = { ...form.value };
        if (!payload.password) delete (payload as any).password;
        const result = await adminStore.updateUser(editingId.value, payload);
        if (result.success) {
            notify('Usuário atualizado com sucesso');
            closeModal();
        } else {
            notify(result.message || 'Erro ao atualizar', 'error');
        }
    } else {
        const result = await adminStore.createUser(form.value);
        if (result.success) {
            notify('Usuário criado com sucesso');
            closeModal();
        } else {
           notify(result.message || 'Erro ao criar', 'error'); 
        }
    }
};

const confirmDelete = async (user: User) => {
    const confirmed = await uiStore.confirm(
        'Excluir Usuário', 
        `Tem certeza que deseja excluir ${user.name}? Essa ação não pode ser desfeita.`
    );

    if (confirmed) {
        const result = await adminStore.deleteUser(user.id);
        if (result.success) {
            notify('Usuário removido');
        } else {
            notify(result.message || 'Erro ao remover', 'error');
        }
    }
}
</script>

<template>
  <div class="users-manager">
    <div class="toolbar">
        <div class="search-box">
             <v-icon name="gi-magnifying-glass" />
             <input v-model="searchQuery" placeholder="Buscar usuário..." />
        </div>
        <button class="btn-primary" @click="openCreateModal">
            <v-icon name="gi-three-friends" /> Novo Usuário
        </button>
    </div>

    <!-- Tabela EasyDataTable -->
    <div class="table-wrapper">
        <EasyDataTable
            :headers="headers"
            :items="items"
            :search-value="searchQuery"
            :loading="adminStore.isLoading"
            alternating
            buttons-pagination
            :rows-per-page="10"
            table-class-name="customize-table"
        >
            <!-- Customização da Coluna NOME -->
            <template #item-name="item">
                <div class="user-info">
                    <span class="name">{{ item.name }}</span>
                    <span class="date">{{ item.created_at }}</span>
                </div>
            </template>

            <!-- Customização da Coluna ROLE -->
            <template #item-role="item">
                <span class="badge" :class="item.role">{{ item.role }}</span>
            </template>

             <!-- Customização da Coluna AÇÕES -->
            <template #item-actions="item">
                <div class="actions-cell">
                    <button class="btn-icon edit" @click="openEditModal(item)" title="Editar">
                        <v-icon name="gi-quill-ink" />
                    </button>
                    <button class="btn-icon delete" @click="confirmDelete(item)" title="Excluir">
                        <v-icon name="fa-trash" />
                    </button>
                </div>
            </template>
            
            <template #empty-message>
                <div class="empty-state">
                    <p>Nenhum usuário encontrado.</p>
                </div>
            </template>

        </EasyDataTable>
    </div>

    <!-- Modal (Mantido) -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-card">
            <h3>{{ isEditing ? 'Editar Usuário' : 'Novo Usuário' }}</h3>
            
            <div class="form-group">
                <label>Nome</label>
                <input v-model="form.name" type="text" placeholder="Nome completo" />
            </div>

            <div class="form-group">
                <label>Email</label>
                <input v-model="form.email" type="email" placeholder="usuario@email.com" />
            </div>
            
            <div class="form-group">
                <label>Função</label>
                <select v-model="form.role">
                    <option value="PLAYER">Jogador</option>
                    <option value="GM">GM</option>
                    <option value="ADMIN">Administrador</option>
                </select>
            </div>

            <div class="form-group">
                <label>Senha {{ isEditing ? '(Deixe em branco para manter)' : '' }}</label>
                <input v-model="form.password" type="password" placeholder="******" />
            </div>

            <div class="modal-actions">
                <button class="btn-ghost" @click="closeModal">Cancelar</button>
                <button class="btn-primary" @click="saveUser">
                    {{ isEditing ? 'Salvar Alterações' : 'Criar Usuário' }}
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<style lang="scss"> 
/* Estilos globais para a tabela (precisa ser não-scoped ou usar deep selector, mas a lib recomenda class name) */
.customize-table {
    --easy-table-border: none;
    --easy-table-row-border: 1px solid var(--border-main);

    --easy-table-header-font-size: 0.85rem;
    --easy-table-header-height: 50px;
    --easy-table-header-font-color: var(--text-secondary);
    --easy-table-header-background-color: rgba(0,0,0,0.1);

    --easy-table-body-row-height: 60px;
    --easy-table-body-row-font-size: 0.95rem;
    --easy-table-body-row-font-color: var(--text-primary);
    --easy-table-body-row-background-color: transparent;
    --easy-table-body-row-hover-background-color: rgba(255, 255, 255, 0.02);
    
    --easy-table-body-even-row-font-color: var(--text-primary);
    --easy-table-body-even-row-background-color: transparent;

    --easy-table-footer-background-color: transparent;
    --easy-table-footer-font-color: var(--text-secondary);
    --easy-table-footer-font-size: 0.85rem;
    --easy-table-footer-padding: 0px 10px;
    --easy-table-footer-height: 50px;

    --easy-table-buttons-pagination-border: 1px solid var(--border-main);
    --easy-table-buttons-pagination-active-background-color: var(--color-accent);
    --easy-table-buttons-pagination-active-border-color: var(--color-accent);
    --easy-table-buttons-pagination-active-font-color: #000;

    background-color: transparent !important;
}

.customize-table .easy-data-table__rows-selector .rows-input__menu {
    background-color: var(--bg-card);
    border: 1px solid var(--border-main);
    z-index: 1000;
}

.customize-table .easy-data-table__rows-selector ul.select-items li {
    background-color: var(--bg-card) !important;
}

.customize-table .easy-data-table__rows-selector ul.select-items li.selected {
    background-color: var(--color-accent) !important;
    color: #000 !important;
}

.customize-table .buttons-pagination .item.button.active {
    background-color: var(--color-accent) !important;
    border-color: var(--color-accent) !important;
    color: #000 !important;
}
</style>

<style lang="scss" scoped>
.users-manager {
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .search-box {
        display: flex;
        align-items: center;
        background: var(--bg-app);
        padding: 8px 12px;
        border-radius: 8px;
        border: 1px solid var(--border-main);
        gap: 8px;

        input {
            background: transparent;
            border: none;
            color: var(--text-primary);
            outline: none;
            font-size: 0.9rem;
        }
    }
}

.table-wrapper {
    border: 1px solid var(--border-main);
    border-radius: 12px;
    background: transparent;
}


.user-info {
    display: flex;
    flex-direction: column;
    .name { font-weight: 500; }
    .date { font-size: 0.75rem; color: var(--text-secondary); }
}

.badge {
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;

    &.ADMIN { background: rgba(255, 215, 0, 0.15); color: #ffd700; border: 1px solid rgba(255, 215, 0, 0.3); }
    &.PLAYER { background: rgba(0, 191, 255, 0.15); color: #00bfff; border: 1px solid rgba(0, 191, 255, 0.3); }
    &.GM { background: rgba(160, 32, 240, 0.15); color: #c39bff; border: 1px solid rgba(160, 32, 240, 0.3); }
}

.actions-cell {
    display: flex;
    align-items: center;
    gap: 8px;
}

.btn-icon {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s;
    padding: 6px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;

    &:hover { 
        color: var(--text-primary); 
        transform: scale(1.1); 
        background-color: rgba(255,255,255,0.05);
    }
    &.delete:hover { color: var(--color-error); background-color: rgba(255, 0, 0, 0.1); }
}

.empty-state {
    text-align: center;
    padding: 20px;
    color: var(--text-secondary);
}

// Reuse modal styles...
.modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-card {
    background: var(--bg-card);
    border: 2px solid var(--border-main);
    padding: 25px;
    border-radius: 16px;
    width: 400px;
    max-width: 90%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);

    h3 { margin: 0; color: var(--color-accent); }
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;

    label { font-size: 0.85rem; color: var(--text-secondary); }
    
    input, select {
        padding: 10px;
        background: var(--bg-app);
        border: 1px solid var(--border-main);
        border-radius: 8px;
        color: var(--text-primary);
        outline: none;

        &:focus { border-color: var(--color-accent); }
    }
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 10px;
}

.btn-primary, .btn-ghost {
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    border: none;
    transition: all 0.2s;
}

.btn-primary {
    background: var(--color-accent);
    color: #000;
    &:hover { filter: brightness(1.1); }
}

.btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-main);
    &:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
}
</style>
