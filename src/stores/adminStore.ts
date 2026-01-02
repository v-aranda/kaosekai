
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '../services/api';
import type { User } from '../types';

export const useAdminStore = defineStore('admin', () => {
    const users = ref<User[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // --- Actions ---

    async function fetchUsers() {
        isLoading.value = true;
        error.value = null;
        try {
            const response = await api.get('/users');
            users.value = response.data;
        } catch (err: any) {
            error.value = err.response?.data?.message || err.message || 'Erro ao buscar usuários';
            console.error(err);
        } finally {
            isLoading.value = false;
        }
    }

    async function createUser(userData: Partial<User>) {
        isLoading.value = true;
        try {
            const response = await api.post('/users', userData);
            users.value.push(response.data);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.message || err.message };
        } finally {
            isLoading.value = false;
        }
    }

    async function updateUser(id: number, userData: Partial<User>) {
        isLoading.value = true;
        try {
            const response = await api.put(`/users/${id}`, userData);
            const idx = users.value.findIndex(u => u.id === id);
            if (idx !== -1) {
                users.value[idx] = response.data;
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.message || err.message };
        } finally {
            isLoading.value = false;
        }
    }

    async function deleteUser(id: number) {
        isLoading.value = true;
        try {
            await api.delete(`/users/${id}`);
            users.value = users.value.filter(u => u.id !== id);
            return { success: true };
        } catch (err: any) {
            return { success: false, message: err.response?.data?.message || err.message };
        } finally {
            isLoading.value = false;
        }
    }

    return { users, isLoading, error, fetchUsers, createUser, updateUser, deleteUser };
});
