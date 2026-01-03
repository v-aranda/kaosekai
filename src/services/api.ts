// src/services/api.ts

import axios from 'axios';
import { useUiStore } from '../stores/uiStore'; 

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://kaosekai-api.varanda.dev.br/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor de Requisição: Adiciona o Token E Ativa o Loader
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // FIX CRÍTICO: Não ative o loader para requisições PUT, 
  // pois são usadas pelo autosave (background task).
  // Também não ativa para requisições marcadas como silenciosas (polling).
  if (config.method !== 'put' && !config.headers['X-Silent-Request']) { 
    const uiStore = useUiStore();
    uiStore.isLoading = true;
  }
  
  return config;
});

// Interceptor de Resposta: Desativa o Loader
api.interceptors.response.use(
  response => {
    // Desativa o loader SOMENTE se ele foi ativado na requisição
    if (response.config.method !== 'put' && !response.config.headers['X-Silent-Request']) {
      const uiStore = useUiStore();
      uiStore.isLoading = false;
    }
    return response;
  },
  error => {
    // Desativa o loader (ERRO)
    if (error.config?.method !== 'put' && !error.config?.headers['X-Silent-Request']) {
      const uiStore = useUiStore();
      uiStore.isLoading = false;
    }

    // Se o token expirou (401), força o logout
    if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.reload(); 
    }

    return Promise.reject(error);
  }
);

export default api;