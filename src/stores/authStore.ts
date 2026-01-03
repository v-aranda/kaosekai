import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import api from '../services/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('auth_token') || '');
  const user = ref(JSON.parse(localStorage.getItem('auth_user') || 'null')) as Ref<{
    id: number;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
  } | null>;
  const isLoadingUser = ref(false);

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/login', { email, password });
      
      // Salva o token e atualiza estado
      token.value = response.data.access_token;
      user.value = response.data.user;
      localStorage.setItem('auth_token', token.value);
      localStorage.setItem('auth_user', JSON.stringify(response.data.user));
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao entrar' 
      };
    }
  }

  async function fetchUser() {
    if (!token.value || isLoadingUser.value) return;
    
    try {
      isLoadingUser.value = true;
      const response = await api.get('/user');
      user.value = response.data;
      localStorage.setItem('auth_user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      // Se falhar, limpa a autenticação
      logout();
    } finally {
      isLoadingUser.value = false;
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    // Opcional: Chamar api.post('/logout') se quiser invalidar no back
  }

  // Busca os dados do usuário ao inicializar se houver token mas não houver user
  if (token.value && !user.value) {
    fetchUser();
  }

  return { token, user, isLoadingUser, login, logout, fetchUser };
});