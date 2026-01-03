<template>
  <div v-if="show" class="dialog-overlay" @click.self="close">
    <div class="dialog-content">
      <div class="dialog-header">
        <h3>Entrar em uma Party</h3>
        <button type="button" class="close-btn" @click="close">
          <v-icon name="gi-cross" />
        </button>
      </div>

      <div class="dialog-body">
        <div class="search-section">
          <label for="party-code">Código da Party (6 dígitos)</label>
          <input 
            id="party-code"
            v-model="code"
            type="text"
            maxlength="6"
            placeholder="Digite o código..."
            class="code-input"
            @input="handleCodeInput"
          />
        </div>

        <div v-if="searching" class="loading">
          Buscando party...
        </div>

        <div v-else-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div v-else-if="foundParty" class="party-preview">
          <div class="party-image-wrapper">
            <img 
              v-if="foundParty.banner" 
              :src="foundParty.banner" 
              :alt="foundParty.name" 
              class="party-image"
            />
            <div v-else class="party-placeholder">
              <v-icon name="gi-three-friends" scale="2" />
            </div>
          </div>
          <div class="party-info">
            <h4>{{ foundParty.name }}</h4>
            <p>{{ foundParty.description }}</p>
            <p class="party-meta">
              <v-icon name="gi-key" scale="0.8" />
              <span>{{ foundParty.code }}</span>
              <span class="separator">•</span>
              <span>{{ foundParty.members_count }} membro(s)</span>
            </p>
          </div>
          <button 
            type="button"
            class="join-btn"
            :disabled="joining"
            @click="handleJoin"
          >
            {{ joining ? 'Entrando...' : 'Entrar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { findPartyByCode, joinParty, type PartyResponse } from '../../services/partyService';
import { useToast } from '../../composables/useToast';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  close: [];
  joined: [];
}>();

const { success, error } = useToast();

const code = ref('');
const searching = ref(false);
const joining = ref(false);
const foundParty = ref<PartyResponse | null>(null);
const errorMessage = ref('');

const handleCodeInput = async () => {
  // Converter para maiúsculas e limpar caracteres inválidos
  code.value = code.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // Resetar estado
  foundParty.value = null;
  errorMessage.value = '';
  
  // Só buscar quando tiver 6 dígitos
  if (code.value.length === 6) {
    await searchParty();
  }
};

const searchParty = async () => {
  if (code.value.length !== 6) return;
  
  try {
    searching.value = true;
    errorMessage.value = '';
    foundParty.value = await findPartyByCode(code.value);
  } catch (err: any) {
    console.error('Error searching party:', err);
    if (err.response?.status === 404) {
      errorMessage.value = 'Party não encontrada com este código.';
    } else {
      errorMessage.value = 'Erro ao buscar party. Tente novamente.';
    }
    foundParty.value = null;
  } finally {
    searching.value = false;
  }
};

const handleJoin = async () => {
  if (!foundParty.value || joining.value) return;
  
  try {
    joining.value = true;
    await joinParty(code.value);
    success('Você entrou na party com sucesso!');
    emit('joined');
    close();
  } catch (err: any) {
    console.error('Error joining party:', err);
    if (err.response?.status === 400) {
      error(err.response.data.message || 'Você já é membro desta party.');
    } else {
      error('Erro ao entrar na party. Tente novamente.');
    }
  } finally {
    joining.value = false;
  }
};

const close = () => {
  code.value = '';
  foundParty.value = null;
  errorMessage.value = '';
  searching.value = false;
  joining.value = false;
  emit('close');
};

// Resetar estado quando o dialog fechar
watch(() => props.show, (newValue) => {
  if (!newValue) {
    code.value = '';
    foundParty.value = null;
    errorMessage.value = '';
    searching.value = false;
    joining.value = false;
  }
});
</script>

<style scoped lang="scss">
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10001;
}

.dialog-content {
  background: #1a1a1a;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #333;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #fff;
  }

  .close-btn {
    background: transparent;
    border: none;
    color: #999;
    cursor: pointer;
    padding: 0.25rem;
    display: flex;
    align-items: center;
    transition: color 0.2s;

    &:hover {
      color: #fff;
    }
  }
}

.dialog-body {
  padding: 1.5rem;
}

.search-section {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    color: #ccc;
    font-size: 0.9rem;
  }

  .code-input {
    width: 100%;
    padding: 0.75rem;
    background: #2a2a2a;
    border: 1px solid #444;
    border-radius: 4px;
    color: #fff;
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-align: center;
    text-transform: uppercase;
    box-sizing: border-box;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #00bcd4;
    }

    &::placeholder {
      color: #666;
      letter-spacing: normal;
    }
  }
}

.loading {
  text-align: center;
  color: #00bcd4;
  padding: 2rem;
  font-size: 0.9rem;
}

.error-message {
  text-align: center;
  color: #ff5252;
  padding: 2rem;
  font-size: 0.9rem;
}

.party-preview {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: #2a2a2a;
  border-radius: 8px;
  border: 1px solid #444;

  .party-image-wrapper {
    width: 100%;
    height: 150px;
    border-radius: 4px;
    overflow: hidden;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;

    .party-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .party-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }
  }

  .party-info {
    h4 {
      margin: 0 0 0.5rem 0;
      color: #fff;
      font-size: 1.1rem;
    }

    p {
      margin: 0;
      color: #999;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .party-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      color: #00bcd4;
      font-weight: 500;

      .separator {
        color: #666;
      }

      span:not(.separator) {
        color: #ccc;
      }
    }
  }

  .join-btn {
    padding: 0.75rem 1.5rem;
    background: #00bcd4;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
      background: #00acc1;
      transform: translateY(-1px);
    }

    &:disabled {
      background: #555;
      cursor: not-allowed;
      opacity: 0.5;
    }
  }
}
</style>
