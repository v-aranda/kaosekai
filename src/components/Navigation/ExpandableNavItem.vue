<script setup lang="ts">
import { ref } from 'vue';

defineProps<{
  icon: string;
  label: string;
  subItems: Array<{ label: string; action: () => void }>;
  isActive?: boolean;
}>();

const isOpen = ref(false);
</script>

<template>
  <div class="expandable-nav-item" @mouseleave="isOpen = false">
    <button 
      class="dock-item" 
      :class="{ active: isActive }"
      :title="label"
      @click="isOpen = !isOpen"
      @mouseenter="isOpen = true"
    >
      <v-icon :name="icon" scale="1.1" />
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="sub-menu">
        <div class="sub-menu-header">{{ label }}</div>
        <button 
          v-for="(item, index) in subItems" 
          :key="index"
          class="sub-menu-item"
          @click.stop="item.action(); isOpen = false"
        >
          {{ item.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.expandable-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Reusing .dock-item styles from global scope, adding specific overrides if needed */
.dock-item.active {
  color: var(--color-accent);
  background: var(--bg-app);
}

.sub-menu {
  position: absolute;
  left: 140%; /* Push it to the right of the sidebar */
  top: 50%;
  transform: translateY(-50%);
  
  background: var(--bg-card);
  border: 2px solid var(--border-main);
  border-radius: 16px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  box-shadow: 6px 6px 0px var(--border-main);
  z-index: 2000;

  &::before {
    content: '';
    position: absolute;
    left: -30px; /* Bridge the gap */
    top: 0;
    bottom: 0;
    width: 30px;
  }
}

.sub-menu-header {
  font-weight: bold;
  padding: 8px 12px;
  border-bottom: 2px solid var(--border-main);
  margin-bottom: 4px;
  color: var(--text-primary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.sub-menu-item {
  background: transparent;
  border: none;
  color: var(--text-primary);
  text-align: left;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--bg-app);
    color: var(--color-accent);
    transform: translateX(4px);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-50%) translateX(-10px);
}
</style>
