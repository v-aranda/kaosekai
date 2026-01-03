<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { uploadImage } from '../services/uploadService';

interface PostItem {
  id: number;
  userId: number;
  name: string;
  avatar?: string | null;
  text: string;
  images?: string[];
  createdAt: Date;
}

interface Party {
  id: number;
  name: string;
  image: string;
}

const authStore = useAuthStore();

const partysOpen = ref(false);
const partysSearch = ref('');

const partys = ref<Party[]>([
  { id: 1, name: 'Dungeons & Dragons', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=150&h=150&fit=crop' },
  { id: 2, name: 'Pathfinder', image: 'https://images.unsplash.com/photo-1538599508199-48bde8b7fd97?w=150&h=150&fit=crop' },
  { id: 3, name: 'Warhammer', image: 'https://images.unsplash.com/photo-1570303008025-7aae4d80b5d9?w=150&h=150&fit=crop' },
  { id: 4, name: 'Magic the Gathering', image: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=150&h=150&fit=crop' },
  { id: 5, name: 'Cyberpunk 2020', image: 'https://images.unsplash.com/photo-1550258987-920a2eeb0991?w=150&h=150&fit=crop' },
  { id: 6, name: 'Call of Cthulhu', image: 'https://images.unsplash.com/photo-1538599508199-48bde8b7fd97?w=150&h=150&fit=crop' },
]);

const posts = ref<PostItem[]>([
  {
    id: 1,
    userId: 2,
    name: 'Admin Kaosekai',
    avatar: authStore.user?.avatar,
    text: 'Bem-vindos! Poste atualizações, ideias ou registros de sessão aqui.',
    images: [],
    createdAt: new Date(),
  },
]);
const newPost = ref('');
const pendingImages = ref<{ file: File; preview: string }[]>([]);
const carouselIndex = ref<Record<number, number>>({});
const expandedImagePostId = ref<number | null>(null);
const expandedImageIndex = ref(0);
const isDraggingFiles = ref(false);
const diceRollerOpen = ref(false);
const selectedDice = ref<string[]>([]);
const diceRolls = ref<{ dice: string; rolls: number[]; total: number }[]>([]);

const currentUserId = computed(() => authStore.user?.id ?? 0);
const currentUserName = computed(() => authStore.user?.name ?? 'Você');
const currentUserAvatar = computed(() => authStore.user?.avatar ?? null);

const filteredPartys = computed(() => {
  if (!partysSearch.value.trim()) return partys.value;
  const search = partysSearch.value.toLowerCase();
  return partys.value.filter(p => p.name.toLowerCase().includes(search));
});

const groupedDice = computed(() => {
  const counts: Record<string, number> = {};
  selectedDice.value.forEach(dice => {
    counts[dice] = (counts[dice] || 0) + 1;
  });
  return Object.entries(counts).map(([dice, count]) => ({ dice, count }));
});

const getDiceIcon = (diceType: string) => {
  const iconMap: Record<string, string> = {
    d4: 'gi-d4',
    d6: 'gi-perspective-dice-six-faces-five',
    d8: 'gi-dice-eight-faces-eight',
    d10: 'gi-d10',
    d12: 'gi-d12',
    d20: 'gi-dice-twenty-faces-twenty',
    d100: 'gi-dice-six-faces-six'
  };
  return iconMap[diceType] || 'gi-dice-six-faces-six';
};

const sortedPosts = computed(() =>
  [...posts.value].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
);

const submitPost = async () => {
  // Se há dados selecionados, rolar e postar resultado
  if (selectedDice.value.length > 0) {
    rollDices();
    
    const rollText = diceRolls.value
      .map(roll => `${roll.dice}: ${roll.rolls.join(' + ')} = ${roll.total}`)
      .join('\n');
    const grandTotal = diceRolls.value.reduce((acc, r) => acc + r.total, 0);
    
    const postText = `🎲 Rolagem de Dados\n\n${rollText}\n\nTotal: ${grandTotal}`;
    
    posts.value.unshift({
      id: Date.now(),
      userId: currentUserId.value,
      name: currentUserName.value,
      avatar: currentUserAvatar.value,
      text: postText,
      images: [],
      createdAt: new Date(),
    });
    
    selectedDice.value = [];
    diceRolls.value = [];
    diceRollerOpen.value = false;
    return;
  }
  
  if (!newPost.value.trim() && pendingImages.value.length === 0) return;

  let uploadedImages: string[] = [];
  if (pendingImages.value.length) {
    uploadedImages = await Promise.all(
      pendingImages.value.map(async (item) => uploadImage(item.file))
    );
  }

  posts.value.unshift({
    id: Date.now(),
    userId: currentUserId.value,
    name: currentUserName.value,
    avatar: currentUserAvatar.value,
    text: newPost.value.trim(),
    images: uploadedImages,
    createdAt: new Date(),
  });
  newPost.value = '';
  pendingImages.value.forEach((p) => URL.revokeObjectURL(p.preview));
  pendingImages.value = [];
};

const userInitial = (name: string) => name?.[0]?.toUpperCase() || '?';

const formatTime = (date: Date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const onImagesSelected = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;
  if (!files?.length) return;
  for (const file of Array.from(files)) {
    const preview = URL.createObjectURL(file);
    pendingImages.value.push({ file, preview });
  }
  target.value = '';
};

const removeImage = (index: number) => {
  const removed = pendingImages.value.splice(index, 1);
  if (removed.length > 0) {
    URL.revokeObjectURL(removed[0].preview);
  }
};

const setCarouselIndex = (postId: number, delta: number, total: number) => {
  const current = carouselIndex.value[postId] ?? 0;
  const next = (current + delta + total) % total;
  carouselIndex.value = { ...carouselIndex.value, [postId]: next };
};

const currentImageIndex = (postId: number) => carouselIndex.value[postId] ?? 0;

const expandedPost = computed(() => {
  if (expandedImagePostId.value === null) return null;
  return posts.value.find(p => p.id === expandedImagePostId.value) || null;
});

const expandedImageUrl = computed(() => {
  if (!expandedPost.value?.images?.length) return '';
  return expandedPost.value.images[expandedImageIndex.value] || '';
});

const openImagePreview = (postId: number, imageIndex: number = 0) => {
  expandedImagePostId.value = postId;
  expandedImageIndex.value = imageIndex;
};

const closeImagePreview = () => {
  expandedImagePostId.value = null;
  expandedImageIndex.value = 0;
};

const nextExpandedImage = () => {
  if (!expandedPost.value?.images?.length) return;
  expandedImageIndex.value = (expandedImageIndex.value + 1) % expandedPost.value.images.length;
};

const prevExpandedImage = () => {
  if (!expandedPost.value?.images?.length) return;
  expandedImageIndex.value = (expandedImageIndex.value - 1 + expandedPost.value.images.length) % expandedPost.value.images.length;
};

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFiles.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  if (e.currentTarget === e.target) {
    isDraggingFiles.value = false;
  }
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
  isDraggingFiles.value = false;
  
  const files = e.dataTransfer?.files;
  if (!files) return;
  
  for (const file of Array.from(files)) {
    if (file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      pendingImages.value.push({ file, preview });
    }
  }
};

const addDice = (diceType: string) => {
  selectedDice.value.push(diceType);
};

const removeDice = (index: number) => {
  selectedDice.value.splice(index, 1);
};

const removeGroupedDice = (diceType: string) => {
  selectedDice.value = selectedDice.value.filter(d => d !== diceType);
};

const rollDices = () => {
  diceRolls.value = [];
  const diceCount: Record<string, number> = {};
  
  selectedDice.value.forEach(dice => {
    diceCount[dice] = (diceCount[dice] || 0) + 1;
  });
  
  Object.entries(diceCount).forEach(([diceType, count]) => {
    const diceSides = parseInt(diceType.replace('d', ''));
    const rolls: number[] = [];
    
    for (let i = 0; i < count; i++) {
      rolls.push(Math.floor(Math.random() * diceSides) + 1);
    }
    
    const total = rolls.reduce((a, b) => a + b, 0);
    diceRolls.value.push({
      dice: `${count}${diceType}`,
      rolls,
      total
    });
  });
};

const closeDiceRoller = () => {
  diceRollerOpen.value = false;
};

const confirmDiceRoll = () => {
  rollDices();
  closeDiceRoller();
  
  // Criar post com resultados dos dados
  if (diceRolls.value.length > 0) {
    const rollText = diceRolls.value
      .map(roll => `${roll.dice}: ${roll.rolls.join(' + ')} = ${roll.total}`)
      .join('\n');
    const grandTotal = diceRolls.value.reduce((acc, r) => acc + r.total, 0);
    
    const postText = `🎲 Rolagem de Dados\n\n${rollText}\n\nTotal: ${grandTotal}`;
    
    posts.value.unshift({
      id: Date.now(),
      userId: currentUserId.value,
      name: currentUserName.value,
      avatar: currentUserAvatar.value,
      text: postText,
      images: [],
      createdAt: new Date(),
    });
    
    // Limpar dados
    selectedDice.value = [];
    diceRolls.value = [];
  }
};
</script>

<template>
  <div class="home-view" @dragover="handleDragOver" @dragleave="handleDragLeave" @drop="handleDrop">
    <div v-if="isDraggingFiles" class="drag-overlay">
      <div class="drag-content">
        <v-icon name="fa-images" scale="3" />
        <p>Solte as imagens aqui</p>
      </div>
    </div>

    <!-- Partys Section -->
    <div class="partys-section">
      <transition name="slide-drawer">
        <div v-if="partysOpen" class="partys-drawer">
          <div class="partys-header">
            <input 
              v-model="partysSearch" 
              type="text" 
              class="partys-search" 
              placeholder="Busque por sua party..."
            />
          </div>
          
          <div class="partys-list">
            <div 
              v-for="party in filteredPartys" 
              :key="party.id" 
              class="party-item"
            >
              <img :src="party.image" :alt="party.name" />
              <span class="party-name">{{ party.name }}</span>
            </div>
          </div>
        </div>
      </transition>

      <button 
        type="button" 
        class="partys-toggle"
        :class="{ active: partysOpen }"
        @click="partysOpen = !partysOpen"
      >
        <v-icon name="gi-three-friends" />
      </button>
    </div>

    <div class="feed" role="log" aria-live="polite">
      <div v-for="post in sortedPosts" :key="post.id" class="post-row" :class="{ mine: post.userId === currentUserId }">
        <div class="avatar">
          <img v-if="post.avatar" :src="post.avatar" :alt="post.name" />
          <span v-else>{{ userInitial(post.name) }}</span>
        </div>
        <div class="bubble">
          <div class="meta">
            <span class="name">{{ post.name }}</span>
            <span class="time">{{ formatTime(post.createdAt) }}</span>
          </div>
          <p class="text" v-if="post.text">{{ post.text }}</p>

          <div v-if="post.images?.length" class="media">
            <div v-if="post.images.length === 1" class="single-image">
              <img :src="post.images[0]" alt="Imagem do post" @click="openImagePreview(post.id, 0)" />
            </div>
            <div v-else class="carousel">
              <div class="carousel-viewport">
                <img :src="post.images[currentImageIndex(post.id)]" alt="Imagem do post" @click="openImagePreview(post.id, currentImageIndex(post.id))" />
              </div>
              <div class="carousel-controls">
                <button class="nav prev" type="button" @click="setCarouselIndex(post.id, -1, post.images.length)">
                  <v-icon name="hi-solid-chevron-left" scale="1.5" />
                </button>
                <div class="dots">
                  <span
                    v-for="(img, idx) in post.images"
                    :key="idx"
                    :class="{ active: idx === currentImageIndex(post.id) }"
                  ></span>
                </div>
                <button class="nav next" type="button" @click="setCarouselIndex(post.id, 1, post.images.length)">
                  <v-icon name="hi-solid-chevron-right" scale="1.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <form class="composer" @submit.prevent="submitPost">
      <div class="composer-avatar">
        <div class="avatar">
          <img v-if="currentUserAvatar" :src="currentUserAvatar" :alt="currentUserName" />
          <span v-else>{{ userInitial(currentUserName) }}</span>
        </div>
      </div>
      <div class="composer-body">
        <textarea
          v-if="!diceRollerOpen"
          v-model="newPost"
          placeholder="Compartilhe algo..."
          rows="2"
        ></textarea>
        
        <div v-else class="dice-inline">
          <div class="dice-selector">
            <button
              v-for="dice in ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']"
              :key="dice"
              type="button"
              class="dice-choice"
              @click="addDice(dice)"
            >
              <v-icon :name="getDiceIcon(dice)" />
              {{ dice }}
            </button>
          </div>
        </div>

        <div class="attachments">
          <label class="file-btn">
            <input type="file" accept="image/*" multiple @change="onImagesSelected" />
            <v-icon name="fa-images" />
            <span>Imagens</span>
          </label>
          <button type="button" class="dice-btn" :class="{ active: diceRollerOpen }" @click="diceRollerOpen = !diceRollerOpen">
            <v-icon name="gi-rolling-dices" />
            <span>Dados</span>
          </button>
          <div class="previews" v-if="pendingImages.length">
            <div v-for="(img, idx) in pendingImages" :key="idx" class="thumb">
              <img :src="img.preview" alt="Prévia" />
              <button type="button" class="remove-btn" @click="removeImage(idx)">
                ×
              </button>
            </div>
          </div>
          <div class="dice-badges" v-if="selectedDice.length > 0">
            <div v-for="group in groupedDice" :key="group.dice" class="dice-badge">
              <v-icon :name="getDiceIcon(group.dice)" scale="0.9" />
              <span>{{ group.count }}x {{ group.dice }}</span>
              <button type="button" class="remove-dice" @click="removeGroupedDice(group.dice)">×</button>
            </div>
          </div>
        </div>
      </div>
      <button type="submit" class="submit-btn">
        <v-icon name="hi-solid-arrow-up" scale="1.5" />
      </button>
    </form>

    <!-- Image Preview Modal -->
    <div v-if="expandedPost" class="image-preview-modal" @click="closeImagePreview">
      <div class="preview-content" @click.stop>
        <button class="close-btn" type="button" @click="closeImagePreview">
          ×
        </button>
        
        <div class="preview-image">
          <img :src="expandedImageUrl" :alt="expandedPost.name" />
        </div>

        <div v-if="expandedPost.text" class="preview-caption">
          {{ expandedPost.text }}
        </div>

        <div v-if="expandedPost.images?.length > 1" class="preview-controls">
          <button class="nav prev" type="button" @click="prevExpandedImage">
            <v-icon name="hi-solid-chevron-left" scale="1.5" />
          </button>
          <div class="dots">
            <span
              v-for="(img, idx) in expandedPost.images"
              :key="idx"
              :class="{ active: idx === expandedImageIndex }"
              @click="expandedImageIndex = idx"
            ></span>
          </div>
          <button class="nav next" type="button" @click="nextExpandedImage">
            <v-icon name="hi-solid-chevron-right" scale="1.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home-view {
  width: 100%;
  height: 100%;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0;
  box-sizing: border-box;
  position: relative;
}

.partys-section {
  display: flex;
  flex-direction: column;
}

.partys-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 10px;
  width: fit-content;
  margin-left: 10px;
  border: 1px solid var(--border-main);
  border-radius: 0 0 10px 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 4.5rem;
}

.partys-toggle:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.partys-toggle.active {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border-color: var(--color-accent);
}

.partys-drawer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-main);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-20px);
  }
}

.slide-drawer-enter-active {
  animation: slideDown 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.partys-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.partys-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.partys-search::placeholder {
  color: var(--text-secondary);
}

.partys-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-right: 6px;
  padding-bottom: 4px;
  scroll-behavior: smooth;
}

.partys-list::-webkit-scrollbar {
  height: 4px;
}

.partys-list::-webkit-scrollbar-track {
  background: transparent;
}

.partys-list::-webkit-scrollbar-thumb {
  background: var(--border-main);
  border-radius: 4px;
}

.partys-list::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.party-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
  text-align: center;
}

.party-item:hover {
  transform: translateY(-4px);
}

.party-item img {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  border: 2px solid var(--border-main);
  transition: all 0.2s ease;
}

.party-item:hover img {
  border-color: var(--color-accent);
}

.party-name {
  font-size: 0.75rem;
  color: var(--text-primary);
  font-weight: 500;
  line-height: 1.2;
  max-width: 70px;
  word-wrap: break-word;
}

.drag-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 200, 200, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drag-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: var(--text-main);
  text-align: center;
}

.drag-content p {
  font-size: 1.2rem;
  font-weight: 600;
}

.feed {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 4px;
}

.post-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: 70%;
}

.post-row.mine {
  margin-left: auto;
  flex-direction: row-reverse;
  text-align: right;
}

.post-row.mine .bubble {
  background: rgba(0, 200, 200, 0.15);
  border-color: var(--color-accent);
}

.post-row.mine .meta {
  justify-content: flex-end;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-main);
  overflow: hidden;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bubble {
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 3px 3px 0 var(--border-main);
  max-width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.name {
  font-weight: 700;
  color: var(--text-primary);
}

.time {
  font-family: 'Share Tech Mono', monospace;
}

.text {
  margin: 6px 0 0;
  white-space: pre-wrap;
  color: var(--text-primary);
}

.composer {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border-main);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 4px 4px 0 var(--border-main);
  position: sticky;
  bottom: 30px;
}

.composer-avatar {
  display: flex;
  align-items: center;
}

.composer-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

textarea {
  width: 100%;
  border: 1px solid var(--border-main);
  border-radius: 10px;
  padding: 10px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  resize: none;
  min-height: 56px;
  box-sizing: border-box;
}

.attachments {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.file-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px dashed var(--border-main);
  border-radius: 10px;
  cursor: pointer;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.file-btn input {
  display: none;
}

.previews {
  display: flex;
  gap: 8px;
}

.thumb {
  width: 52px;
  height: 52px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-main);
  background: var(--bg-secondary);
  position: relative;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border: none;
  width: 100%;
  height: 100%;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.thumb:hover .remove-btn {
  display: flex;
}

.dice-badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dice-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 10px;
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border: 1px solid var(--border-main);
  font-size: 0.85rem;
  font-weight: 600;
  position: relative;
}

.dice-badge .remove-dice {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  margin-left: 4px;
  font-weight: bold;
  opacity: 0.7;
}

.dice-badge .remove-dice:hover {
  opacity: 1;
}

.previews {
  display: flex;
  gap: 8px;
}

.thumb-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rotate-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-main);
}

.rotate-btn:hover {
  background: var(--bg-card);
}

button[type='submit'] {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border: 1px solid var(--border-main);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  padding: 0;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 3px 3px 0 var(--border-main);
  display: flex;
  align-items: center;
  justify-content: center;
}
button[type='submit']:hover {
  transform: translateY(-1px);
}

button[type='submit']:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .post-row {
    max-width: 90%;
  }

  .composer {
    grid-template-columns: auto 1fr;
    grid-template-rows: auto auto;
    gap: 8px;
  }

  button[type='submit'] {
    grid-column: 1 / -1;
    width: 100%;
  }
}

.media {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.single-image img,
.carousel-viewport img {
  max-width: 320px;
  height: 100%;
  border-radius: 12px;
  background: var(--bg-secondary);
  object-fit: contain;
}

.carousel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.carousel-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.carousel-viewport {
  width: 320px;
  height: 200px;
  overflow: hidden;
  border-radius: 12px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav {
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  cursor: pointer;
  color: var(--text-main);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dots {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-main);
  display: inline-block;
}

.dots span.active {
  background: var(--color-accent);
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.preview-content {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 20px;
  width: 90vw;
  height: 90vh;
  max-width: 600px;
  max-height: 700px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  box-sizing: border-box;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-main);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  overflow: hidden;
}

.preview-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.preview-caption {
  text-align: center;
  color: var(--text-main);
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
  line-height: 1.5;
}

.preview-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.preview-controls .dots span {
  cursor: pointer;
}

.dice-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px dashed var(--border-main);
  border-radius: 10px;
  cursor: pointer;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s ease;
}

.dice-btn.active {
  background: var(--color-accent);
  color: var(--bg-card);
  border-color: var(--color-accent);
  border-style: solid;
}

.dice-inline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  border: 1px solid var(--border-main);
}

.dice-inline h4 {
  color: var(--text-main);
  margin: 0 0 8px 0;
  font-size: 0.9rem;
}

.dice-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.dice-content {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 24px;
  width: 90vw;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.dice-content .close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-main);
  font-size: 1.5rem;
}

.dice-content h3,
.dice-content h4 {
  color: var(--text-main);
  margin: 0 0 16px 0;
}

.dice-selector {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.dice-choice {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
  border: 1px solid var(--border-main);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.dice-choice:hover {
  transform: translateY(-2px);
}

.selected-dice,
.dice-results {
  padding: 12px;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border-main);
}

.dice-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.dice-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-card);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-main);
}

.dice-item button {
  background: transparent;
  border: none;
  color: var(--text-main);
  cursor: pointer;
  font-weight: bold;
}

.roll-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-main);
}

.roll-item strong {
  color: var(--text-main);
}

.rolls {
  color: var(--text-secondary);
  font-family: 'Share Tech Mono', monospace;
}

.grand-total {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  margin-top: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-accent);
}

.dice-actions {
  display: flex;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--border-main);
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

.btn-primary {
  background: var(--color-accent);
  color: var(--text-on-light, #000);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-main);
}
</style>
