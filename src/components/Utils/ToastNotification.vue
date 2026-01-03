<script setup lang="ts">
import { ref } from 'vue';

// Estado global simples exposto para ser chamado de qualquer lugar
const visible = ref(false);
const message = ref('');
const type = ref<'success' | 'error'>('success');

// Função para mostrar o toast (pode ser exportada ou usada via ref se preferir, 
// mas para simplicidade neste setup, vamos usar um EventBus ou Store seria melhor. 
// Vamos fazer ele ser controlado por Props ou Expose para simplificar a integração na Main Page)

defineExpose({
  show: (msg: string, msgType: 'success' | 'error' = 'success') => {
    message.value = msg;
    type.value = msgType;
    visible.value = true;
    setTimeout(() => {
      visible.value = false;
    }, 3000); // Some em 3 segundos
  }
});
</script>

<template>
  <Transition name="toast-fade">
    <div v-if="visible" class="toast" :class="type">
      <span class="icon">{{ type === 'success' ? '✔' : '✖' }}</span>
      <span class="text">{{ message }}</span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 2px solid black;
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 5px 5px 0px rgba(0,0,0,1);
  z-index: 99999;
  font-family: 'Share Tech Mono', monospace;
  min-width: 250px;

  &.error {
    border-color: red;
    color: red;
    .icon { background: red; color: white; }
  }
  
  &.success {
    border-color: cyan;
    color: black;
    .icon { background: cyan; color: black; }
  }

  .icon {
    width: 20px; height: 20px;
    border-radius: 50%;
    display: flex; justify-content: center; align-items: center;
    font-weight: bold; font-size: 0.8rem;
  }
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>