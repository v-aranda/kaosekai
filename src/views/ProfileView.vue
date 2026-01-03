<script setup lang="ts">
import { ref, inject, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import type { Ref } from 'vue';
import type { User } from '../types';
import { useAuthStore } from '../stores/authStore';
import { useAdminStore } from '../stores/adminStore';
import { uploadImage } from '../services/uploadService';
import { updateProfile } from '../services/profileService';
import ImageCropperDialog from '../components/CharacterSheet/Dialogs/Notes/ImageCropperDialog.vue';

const authStore = useAuthStore();
const { user: authUser } = storeToRefs(authStore);
const adminStore = useAdminStore();
const notify = inject('notify') as ((msg: string, type?: 'success' | 'error') => void) | undefined;
const profileTargetUser = inject<Ref<User | null> | undefined>('profileTargetUser');
const closeProfileDialog = inject<(() => void) | undefined>('closeProfileDialog');

const name = ref('');
const email = ref('');
const password = ref('');
const avatarUrl = ref<string>('');
const isUploading = ref(false);
const isSaving = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const showCropper = ref(false);
const cropImageSrc = ref<string | null>(null);

const activeUser = computed<User | null>(() => profileTargetUser?.value ?? authUser.value);
const isAdminEditing = computed(() => Boolean(profileTargetUser?.value));
const subtitle = computed(() => {
  if (isAdminEditing.value && activeUser.value) {
    return `Editando ${activeUser.value.name} como admin.`;
  }
  return 'Edite seus dados e foto.';
});

const syncForm = (user: User | null) => {
  name.value = user?.name ?? '';
  email.value = user?.email ?? '';
  avatarUrl.value = user?.avatar ?? '';
  password.value = '';
};

watch(
  () => activeUser.value,
  (user) => syncForm(user),
  { immediate: true }
);

const handleSave = async () => {
  if (!activeUser.value) {
    notify?.('Nenhum usuário carregado', 'error');
    return;
  }

  const payload: any = {};
  if (name.value) payload.name = name.value;
  if (email.value) payload.email = email.value;
  if (password.value) payload.password = password.value;
  if (avatarUrl.value) payload.avatar = avatarUrl.value;

  if (Object.keys(payload).length === 0) {
    notify?.('Nada para salvar', 'error');
    return;
  }

  isSaving.value = true;
  try {
    if (profileTargetUser?.value) {
      const result = await adminStore.updateUser(profileTargetUser.value.id, payload);
      if (!result.success || !result.user) {
        throw new Error(result.message || 'Falha ao atualizar usuário');
      }
      profileTargetUser.value = result.user;
      syncForm(result.user);

      if (authUser.value && authUser.value.id === result.user.id) {
        authUser.value = result.user as any;
        localStorage.setItem('auth_user', JSON.stringify(result.user));
      }

      password.value = '';
      notify?.('Usuário atualizado', 'success');
    } else {
      const updated = await updateProfile(payload);
      authUser.value = updated;
      localStorage.setItem('auth_user', JSON.stringify(updated));
      password.value = '';
      notify?.('Perfil atualizado', 'success');
    }
  } catch (err: any) {
    console.error(err);
    const message = err?.response?.data?.message || err?.message || 'Falha ao atualizar perfil';
    notify?.(message, 'error');
  } finally {
    isSaving.value = false;
  }
};

const triggerFilePicker = () => {
  fileInput.value?.click();
};

const onFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files || !files.length) return;

  const file = files[0];
  cropImageSrc.value = URL.createObjectURL(file);
  showCropper.value = true;
  if (target) target.value = '';
};

const closeCropper = () => {
  if (cropImageSrc.value) URL.revokeObjectURL(cropImageSrc.value);
  cropImageSrc.value = null;
  showCropper.value = false;
};

const handleCropConfirm = async (blob: Blob) => {
  isUploading.value = true;
  try {
    const file = new File([blob], 'avatar.png', { type: 'image/png' });
    const url = await uploadImage(file);
    avatarUrl.value = url;
    notify?.('Foto enviada (salvamento do perfil ainda não aplicado)', 'success');
  } catch (err) {
    console.error(err);
    notify?.('Falha ao enviar imagem', 'error');
  } finally {
    isUploading.value = false;
    closeCropper();
  }
};
</script>

<template>
  <Teleport to="body">
    <div class="profile-overlay" aria-modal="true" role="dialog">
      <div class="profile-view">
        <div class="card">
          <div class="card-header">
            <div>
              <h2>{{ isAdminEditing ? 'Editar usuário' : 'Perfil' }}</h2>
              <p class="muted">{{ subtitle }} As alterações são salvas agora.</p>
            </div>
            <button class="btn ghost close" type="button" @click="closeProfileDialog?.()">✕</button>
          </div>

          <div class="avatar-row">
            <div class="avatar-frame">
              <img v-if="avatarUrl" :src="avatarUrl" alt="Foto de perfil" />
              <div v-else class="avatar-placeholder">?</div>
            </div>
            <div class="avatar-actions">
              <button class="btn ghost" type="button" @click="triggerFilePicker" :disabled="isUploading">
                {{ isUploading ? 'Enviando...' : 'Trocar foto' }}
              </button>
              <input ref="fileInput" type="file" accept="image/*" class="hidden-file" @change="onFileSelected" />
            </div>
          </div>

          <label>Nome</label>
          <input v-model="name" type="text" placeholder="Seu nome" />

          <label>Email</label>
          <input v-model="email" type="email" placeholder="seu@email.com" />

          <label>Nova senha</label>
          <input v-model="password" type="password" placeholder="(opcional)" />

          <button class="btn" @click="handleSave" :disabled="isSaving">
            {{ isSaving ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

        <ImageCropperDialog
          :isOpen="showCropper"
          :imageSrc="cropImageSrc"
          :aspectRatio="1"
          @close="closeCropper"
          @confirm="handleCropConfirm"
        />
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">

.profile-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
  padding: 1rem;
}

.profile-view {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0;
}

.card {
  width: min(520px, 100%);
  background: var(--bg-card);
  border: 2px solid var(--border-main);
  border-radius: 14px;
  box-shadow: 6px 6px 0 var(--border-main);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.avatar-row {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.avatar-frame {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--border-main);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 1.5rem;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hidden-file {
  display: none;
}

h2 {
  margin: 0;
  color: var(--text-primary);
}

.muted {
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

label {
  font-weight: 700;
  color: var(--text-primary);
}

input {
  width: 100%;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  border: 1px solid var(--border-main);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 1rem;
  box-sizing: border-box;
}

.btn {
  margin-top: 0.5rem;
  padding: 0.85rem 1.1rem;
  border-radius: 10px;
  border: 2px solid var(--border-main);
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease;
  width: 100%;
  font-size: 1rem;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn.ghost {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-color: var(--border-main);
  width: auto;
}

.btn:disabled,
.btn.ghost:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
