<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { listParties, type PartyResponse } from '../../services/partyService';
import { searchUsers, inviteUserToParty, type UserSearchResult } from '../../services/invitationService';
import { useToast } from '../../composables/useToast';

interface CommunityWithMembers extends PartyResponse {
  showInviteDialog?: boolean;
}

const communities = ref<CommunityWithMembers[]>([]);
const loadingCommunities = ref(false);
const selectedCommunityId = ref<number | null>(null);
const inviteDialogOpen = ref(false);
const searchQuery = ref('');
const searchResults = ref<UserSearchResult[]>([]);
const searchLoading = ref(false);
const inviteInProgress = ref(false);

const toast = useToast();

const loadCommunities = async () => {
  try {
    loadingCommunities.value = true;
    const data = await listParties();
    communities.value = data.map(c => ({ ...c, showInviteDialog: false }));
  } catch (error) {
    console.error('Failed to load communities:', error);
    toast.error('Erro ao carregar comunidades');
    communities.value = [];
  } finally {
    loadingCommunities.value = false;
  }
};

const openInviteDialog = (communityId: number) => {
  selectedCommunityId.value = communityId;
  inviteDialogOpen.value = true;
  searchQuery.value = '';
  searchResults.value = [];
};

const closeInviteDialog = () => {
  inviteDialogOpen.value = false;
  selectedCommunityId.value = null;
  searchQuery.value = '';
  searchResults.value = [];
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = [];
    return;
  }

  try {
    searchLoading.value = true;
    const results = await searchUsers(searchQuery.value);
    searchResults.value = results;
  } catch (error) {
    console.error('Failed to search users:', error);
    toast.error('Erro ao buscar usuários');
    searchResults.value = [];
  } finally {
    searchLoading.value = false;
  }
};

const inviteUser = async (userId: number, userEmail: string) => {
  if (!selectedCommunityId.value) return;

  try {
    inviteInProgress.value = true;
    await inviteUserToParty(selectedCommunityId.value, userId);
    toast.success(`Usuário ${userEmail} convidado com sucesso!`);
    searchResults.value = searchResults.value.filter(u => u.id !== userId);
    // Recarregar comunidades para atualizar contagem de membros
    loadCommunities();
  } catch (error: any) {
    console.error('Failed to invite user:', error);
    const message = error?.response?.data?.message || 'Erro ao convidar usuário';
    toast.error(message);
  } finally {
    inviteInProgress.value = false;
  }
};

const getSelectedCommunityName = computed(() => {
  return communities.value.find(c => c.id === selectedCommunityId.value)?.name || '';
});

onMounted(() => {
  loadCommunities();
});
</script>

<template>
  <div class="communities-manager">
    <div class="header">
      <h2>Gerenciar Comunidades</h2>
      <button
        v-if="communities.length > 0"
        type="button"
        class="refresh-btn"
        @click="loadCommunities"
        :disabled="loadingCommunities"
      >
        <v-icon name="fa-refresh" />
        {{ loadingCommunities ? 'Carregando...' : 'Atualizar' }}
      </button>
    </div>

    <div v-if="loadingCommunities" class="loading">
      <p>Carregando comunidades...</p>
    </div>

    <div v-else-if="communities.length === 0" class="no-communities">
      <p>Nenhuma comunidade encontrada</p>
    </div>

    <div v-else class="communities-grid">
      <div
        v-for="community in communities"
        :key="community.id"
        class="community-card"
      >
        <div class="community-header">
          <h3>{{ community.name }}</h3>
          <span class="member-count">{{ community.members_count }} membro(s)</span>
        </div>

        <div v-if="community.banner" class="community-banner">
          <img :src="community.banner" :alt="community.name" />
        </div>

        <div class="community-actions">
          <button
            type="button"
            class="action-btn invite-btn"
            @click="openInviteDialog(community.id)"
            title="Convidar membro"
          >
            <v-icon name="fa-user-plus" />
            Convidar
          </button>
        </div>
      </div>
    </div>

    <!-- Invite Dialog -->
    <div v-if="inviteDialogOpen" class="dialog-overlay" @click.self="closeInviteDialog">
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Convidar Usuário para: {{ getSelectedCommunityName }}</h3>
          <button
            type="button"
            class="close-btn"
            @click="closeInviteDialog"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        <div class="dialog-body">
          <div class="search-section">
            <div class="search-input-group">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Procurar por nome ou email..."
                @input="performSearch"
                @keyup.enter="performSearch"
                class="search-input"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="clear-search-btn"
                @click="searchQuery = ''"
                title="Limpar busca"
              >
                ✕
              </button>
            </div>

            <div v-if="searchLoading" class="search-loading">
              <p>Buscando usuários...</p>
            </div>

            <div v-else-if="searchQuery && searchResults.length === 0" class="no-results">
              <p>Nenhum usuário encontrado</p>
            </div>

            <div v-else-if="searchResults.length > 0" class="search-results">
              <div
                v-for="user in searchResults"
                :key="user.id"
                class="user-item"
              >
                <div class="user-info">
                  <div v-if="user.avatar" class="user-avatar">
                    <img :src="user.avatar" :alt="user.name" />
                  </div>
                  <div v-else class="user-avatar-placeholder">
                    {{ user.name[0]?.toUpperCase() || '?' }}
                  </div>
                  <div class="user-details">
                    <span class="user-name">{{ user.name }}</span>
                    <span class="user-email">{{ user.email }}</span>
                  </div>
                </div>
                <button
                  type="button"
                  class="invite-user-btn"
                  @click="inviteUser(user.id, user.email)"
                  :disabled="inviteInProgress"
                >
                  {{ inviteInProgress ? 'Convidando...' : 'Convidar' }}
                </button>
              </div>
            </div>

            <div v-else class="empty-search">
              <p>Digite um nome ou email para procurar usuários</p>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button
            type="button"
            class="cancel-btn"
            @click="closeInviteDialog"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.communities-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;

    h2 {
      color: var(--text-main);
      margin: 0;
      font-size: 1.5rem;
    }

    .refresh-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--color-accent);
      color: var(--bg-card);
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }

  .loading,
  .no-communities {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: var(--text-secondary);
    font-size: 1.1rem;
  }

  .communities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    overflow-y: auto;

    .community-card {
      background: var(--bg-card);
      border: 2px solid var(--border-main);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border-color: var(--color-accent);
      }

      .community-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 8px;

        h3 {
          color: var(--text-main);
          margin: 0;
          flex: 1;
          word-break: break-word;
        }

        .member-count {
          color: var(--text-secondary);
          font-size: 0.9rem;
          white-space: nowrap;
          padding: 4px 8px;
          background: var(--bg-secondary);
          border-radius: 6px;
        }
      }

      .community-banner {
        width: 100%;
        height: 120px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-secondary);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .community-actions {
        display: flex;
        gap: 8px;

        .action-btn {
          flex: 1;
          padding: 8px 12px;
          background: var(--color-accent);
          color: var(--bg-card);
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;

          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }

          &:active {
            transform: translateY(0);
          }
        }
      }
    }
  }
}

// Dialog Styles
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
  padding: 16px;

  .dialog-content {
    background: var(--bg-card);
    border: 2px solid var(--border-main);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 2px solid var(--border-main);

      h3 {
        color: var(--text-main);
        margin: 0;
        flex: 1;
      }

      .close-btn {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: 1.5rem;
        padding: 0;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--bg-secondary);
          color: var(--text-main);
        }
      }
    }

    .dialog-body {
      flex: 1;
      overflow-y: auto;
      padding: 20px;

      .search-section {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .search-input-group {
          position: relative;
          display: flex;
          align-items: center;

          .search-input {
            width: 100%;
            padding: 12px 40px 12px 16px;
            border: 2px solid var(--border-main);
            border-radius: 8px;
            background: var(--bg-secondary);
            color: var(--text-main);
            font-size: 1rem;
            transition: all 0.2s ease;

            &:focus {
              outline: none;
              border-color: var(--color-accent);
            }

            &::placeholder {
              color: var(--text-secondary);
            }
          }

          .clear-search-btn {
            position: absolute;
            right: 12px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1.2rem;
            padding: 4px;

            &:hover {
              color: var(--text-main);
            }
          }
        }

        .search-loading,
        .no-results,
        .empty-search {
          text-align: center;
          padding: 20px;
          color: var(--text-secondary);
        }

        .search-results {
          display: flex;
          flex-direction: column;
          gap: 12px;

          .user-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: var(--bg-secondary);
            border-radius: 8px;
            gap: 12px;

            .user-info {
              display: flex;
              align-items: center;
              gap: 12px;
              flex: 1;

              .user-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                overflow: hidden;
                background: var(--border-main);

                img {
                  width: 100%;
                  height: 100%;
                  object-fit: cover;
                }
              }

              .user-avatar-placeholder {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: var(--color-accent);
                color: var(--bg-card);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
              }

              .user-details {
                display: flex;
                flex-direction: column;
                gap: 4px;
                flex: 1;
                min-width: 0;

                .user-name {
                  color: var(--text-main);
                  font-weight: 600;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }

                .user-email {
                  color: var(--text-secondary);
                  font-size: 0.9rem;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              }
            }

            .invite-user-btn {
              padding: 6px 16px;
              background: var(--color-accent);
              color: var(--bg-card);
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 600;
              white-space: nowrap;
              transition: all 0.2s ease;

              &:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
              }

              &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
              }
            }
          }
        }
      }
    }

    .dialog-footer {
      padding: 20px;
      border-top: 2px solid var(--border-main);
      display: flex;
      gap: 12px;
      justify-content: flex-end;

      .cancel-btn {
        padding: 10px 20px;
        background: var(--bg-secondary);
        color: var(--text-main);
        border: 2px solid var(--border-main);
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.2s ease;

        &:hover {
          background: var(--border-main);
        }
      }
    }
  }
}
</style>
