<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useToast } from '../../composables/useToast';
import { searchUsers as searchUsersService, inviteUserToParty } from '../../services/invitationService';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface Props {
  isOpen: boolean;
  partyId?: number | bigint;
}

interface Emits {
  (e: 'close'): void;
  (e: 'invited', userId: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
});

const emit = defineEmits<Emits>();
const toast = useToast();

const searchQuery = ref('');
const users = ref<User[]>([]);
const loading = ref(false);
const invitingUserId = ref<number | null>(null);

const filteredUsers = computed(() =>
  users.value.filter(user =>
    user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
);

const searchUsers = async () => {
  if (!searchQuery.value.trim()) {
    users.value = [];
    return;
  }

  loading.value = true;
  try {
    users.value = await searchUsersService(searchQuery.value);
  } catch (error) {
    toast.error('Erro ao buscar usuários');
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const inviteUser = async (userId: number) => {
  if (!props.partyId) {
    toast.error('ID da party não encontrado');
    return;
  }

  invitingUserId.value = userId;
  try {
    await inviteUserToParty(Number(props.partyId), userId);
    toast.success('Usuário convidado com sucesso!');
    users.value = users.value.filter(u => u.id !== userId);
    emit('invited', userId);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao convidar usuário');
    console.error(error);
  } finally {
    invitingUserId.value = null;
  }
};

watch(
  () => props.isOpen,
  (newVal) => {
    if (!newVal) {
      searchQuery.value = '';
      users.value = [];
    }
  }
);
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="backdrop" @click="emit('close')">
      <div class="dialog-box" @click.stop>
        <div class="header">
          <h3>Convidar Membro</h3>
          <button type="button" class="close-btn" @click="emit('close')">
            <v-icon name="hi-solid-x-mark" />
          </button>
        </div>

        <div class="body">
          <div class="search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar usuário por nome ou email..."
              class="search-input"
              @input="searchUsers"
            />
            <span v-if="loading" class="loading">Carregando...</span>
          </div>

          <div class="users-list">
            <div v-if="filteredUsers.length === 0 && !loading" class="empty">
              {{ searchQuery ? 'Nenhum usuário encontrado' : 'Digite para buscar usuários' }}
            </div>

            <div v-for="user in filteredUsers" :key="user.id" class="user-item">
              <div class="user-info">
                <div v-if="user.avatar" class="avatar">
                  <img :src="user.avatar" :alt="user.name" />
                </div>
                <div v-else class="avatar-placeholder">
                  {{ user.name.charAt(0).toUpperCase() }}
                </div>
                <div class="details">
                  <span class="name">{{ user.name }}</span>
                  <span class="email">{{ user.email }}</span>
                </div>
              </div>
              <button
                type="button"
                class="invite-btn"
                :disabled="invitingUserId === user.id"
                @click="inviteUser(user.id)"
              >
                {{ invitingUserId === user.id ? 'Convidando...' : 'Convidar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  backdrop-filter: blur(2px);
}

.dialog-box {
  background: white;
  border: 2px solid black;
  box-shadow: 8px 8px 0px rgba(0, 0, 0, 1);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  font-family: 'Share Tech Mono', monospace;
  animation: slideUp 0.2s ease-out;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 2px solid black;

  h3 {
    margin: 0;
    font-size: 1.5rem;
    color: black;
  }

  .close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    color: black;

    &:hover {
      color: #666;
    }
  }
}

.body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;

  .search-container {
    position: relative;
    margin-bottom: 15px;

    .search-input {
      width: 100%;
      padding: 10px;
      border: 2px solid black;
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.9rem;
      box-sizing: border-box;

      &:focus {
        outline: none;
        box-shadow: inset 0 0 0 2px rgba(0, 0, 0, 0.1);
      }
    }

    .loading {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: #666;
    }
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 400px;
    overflow-y: auto;

    .empty {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9rem;
    }

    .user-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: background-color 0.2s;

      &:hover {
        background-color: #f5f5f5;
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: black;
          flex-shrink: 0;
        }

        .details {
          display: flex;
          flex-direction: column;
          min-width: 0;

          .name {
            font-weight: bold;
            color: black;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .email {
            font-size: 0.85rem;
            color: #666;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }
      }

      .invite-btn {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-family: 'Share Tech Mono', monospace;
        font-size: 0.85rem;
        white-space: nowrap;
        margin-left: 10px;
        transition: background-color 0.2s;

        &:hover:not(:disabled) {
          background: #45a049;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
