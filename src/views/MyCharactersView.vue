<script setup lang="ts">
import { onMounted, inject, ref, computed } from 'vue';
import { useCharacterStore } from '../stores/characterStore';
import { useUiStore } from '../stores/uiStore';
import CharacterCard from '../components/MyCharactersList/CharacterCard.vue';
import SearchBar from '../components/Utils/SearchBar.vue';

const store = useCharacterStore();
const ui = useUiStore();

const notify = inject('notify') as (msg: string, type: 'success'|'error') => void;

// Busca reativa por nome
const searchQuery = ref('');
const normalized = (s: string) => (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
const filteredCharacters = computed(() => {
    const q = normalized(searchQuery.value);
    if (!q) return store.characterList;
    return store.characterList.filter(c => normalized(c.name).includes(q));
});

// Lógica de Confirmação de Exclusão
const handleDelete = async (id: number) => {
    const confirmed = await ui.confirm(
        'EXCLUIR PERSONAGEM?', 
        'Esta ação removerá a ficha permanentemente do banco de dados. Confirmar?'
    );

    if (confirmed) {
        try {
            await store.deleteCharacter(id);
            notify('Personagem excluído com sucesso.', 'success');
        } catch (e) {
            notify('Erro ao excluir personagem.', 'error');
        }
    }
};

// Lógica de Criação
const handleCreate = async () => {
    const success = await store.createNewCharacter();
    if (success) {
        notify('Novo personagem criado.', 'success');
    } else {
        notify('Erro ao criar personagem.', 'error');
    }
}

onMounted(() => {
    store.fetchList();
});
</script>

<template>
<div class="view-container">
<div class="view-header">
<h1>MEUS PERSONAGENS</h1>
<p>SUAS LENDAS NASCEM AQUI!</p>
<SearchBar
    v-model="searchQuery"
    :results-count="filteredCharacters.length"
    placeholder="Buscar por nome de personagem..."
    aria-label="Buscar personagem por nome"
/>
</div>
<div class="char-grid">
<button class="card create-card" @click="handleCreate">
<span class="plus">+</span>
<span>NOVO PERSONAGEM</span>
</button>
<CharacterCard 
v-for="char in filteredCharacters" 
:key="char.id" 
:character="char"
@select="store.selectCharacter"
@delete="handleDelete"
/>
</div>
</div>
</template>

<style scoped lang="scss">
/* Container Principal */
.view-container { 
    max-width: 1200px; 
    margin: 0 auto; 
    padding: 1.5rem;
}

/* Header */
.view-header { 
    margin-bottom: 30px; 
    border-bottom: 4px solid var(--border-main); 
    padding-bottom: 10px; 
}

h1 { 
    font-size: 2rem; 
    margin: 0; 
    letter-spacing: 2px; 
    text-transform: uppercase; 
    color: var(--text-primary); 
}

p { 
    margin: 5px 0 0 0; 
    color: var(--text-secondary); 
    font-weight: bold; 
    letter-spacing: 1px; 
}

/* Grid Layout */
.char-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); 
    gap: 25px; 
    align-items: start;
}

/* Estilo do Card "Criar Novo" */
.card {
    /* Base Brutalist compartilhada com CharacterCard */
    border: 3px solid var(--border-main);
    box-shadow: 6px 6px 0px var(--shadow-main);
    transition: all 0.1s;
    background: var(--bg-card);
}

.create-card {
    background: var(--bg-app); 
    border-style: dashed;
    display: flex; flex-direction: column;
    align-items: center; 
    justify-content: center;
    color: var(--text-secondary);
    min-height: 300px;
    height: 100%;
    cursor: pointer;
}

.create-card:hover { 
    background: var(--bg-card); 
    color: var(--text-primary); 
    border-style: solid;
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0px var(--shadow-main);
}

.create-card:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px var(--shadow-main);
}

.plus { 
    font-size: 3rem; 
    line-height: 1; 
}
</style>