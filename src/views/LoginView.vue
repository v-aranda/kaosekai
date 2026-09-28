<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';

const auth = useAuthStore();
const ui = useUiStore();
const email = ref('vinicius@kaosekai.com');
const password = ref('');
const errorMsg = ref('');

const handleLogin = async () => {
    errorMsg.value = '';
    
    // ui.isLoading é gerenciado pelo Axios Interceptor
    const result = await auth.login(email.value, password.value);
    
    if (!result.success) {
        errorMsg.value = result.message || 'Falha na autenticação';
    }
};
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <h1>KAOSEKAI</h1>
        <p>BEM VINDO AO CAOS</p>
      </div>

      <div class="form-group">
        <label>E-MAIL</label>
        <input v-model="email" type="email" placeholder="seu@email.com" :disabled="ui.isLoading" />
      </div>

      <div class="form-group">
        <label>SENHA</label>
        <input v-model="password" type="password" placeholder="••••••" @keyup.enter="handleLogin" :disabled="ui.isLoading" />
      </div>

      <div v-if="errorMsg" class="error-alert">{{ errorMsg }}</div>

      <button class="btn-primary" @click="handleLogin" :disabled="ui.isLoading">
        {{ ui.isLoading ? 'ENTRANDO...' : 'ENTRAR' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-wrapper {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg-app); 
}

.login-card {
    width: 100%; max-width: 400px;
    background: var(--bg-card); 
    padding: 40px;
    
    border: 3px solid var(--border-main);
    box-shadow: 8px 8px 0px var(--shadow-main);
    border-radius: 0; 
    
    text-align: left;
}

.login-header { 
    text-align: center; 
    margin-bottom: 32px; 
    text-transform: uppercase;
}
.login-header h1 { 
    margin: 0; 
    font-size: 1.8rem; 
    color: var(--color-accent); 
    letter-spacing: 2px;
}
.login-header p { 
    margin-top: 8px; 
    color: var(--text-secondary); 
    font-weight: bold;
    letter-spacing: 1px;
}

.form-group { margin-bottom: 20px; }
.form-group label { 
    display: block; 
    font-size: 0.9rem; 
    font-weight: bold; 
    color: var(--text-primary); 
    margin-bottom: 8px;
    text-transform: uppercase;
}

input {
    width: 100%;
    padding: 10px 12px;
    
    border: 2px solid var(--border-main);
    border-radius: 0;
    
    font-size: 1rem;
    background: var(--bg-app); 
    color: var(--text-primary);
    
    &:focus { 
        outline: none; 
        border-color: var(--color-accent); 
        box-shadow: 2px 2px 0px var(--color-accent);
    }
    &:disabled { 
        background: var(--bg-footer); 
        cursor: not-allowed; 
        color: var(--text-secondary);
    }
}

.btn-primary {
    width: 100%;
    padding: 12px;
    
    background-color: var(--color-accent); 
    color: var(--text-on-light); 
    border: 2px solid var(--border-main);
    box-shadow: 3px 3px 0px var(--shadow-main);
    border-radius: 0;
    
    font-weight: bold;
    font-size: 1rem;
    cursor: pointer;
    text-transform: uppercase;
    
    &:hover { 
        background-color: var(--color-accent-dark); 
        color: var(--text-on-light);
        transform: translate(-1px, -1px);
    }
    &:active {
        transform: translate(2px, 2px);
        box-shadow: 0px 0px 0px var(--shadow-main);
    }
    &:disabled { 
        background-color: var(--bg-footer); 
        color: var(--text-secondary); 
        cursor: not-allowed; 
        box-shadow: none;
    }
}

.error-alert {
    background: var(--color-error); 
    color: white; 
    padding: 10px; 
    border-radius: 0; 
    font-size: 0.9rem;
    margin-bottom: 20px; 
    text-align: center;
    font-weight: bold;
    border: 2px solid var(--border-main);
}
</style>