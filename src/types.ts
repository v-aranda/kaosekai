// 1. Tipos para Pericias
export interface SkillItem {
  name: string;
  value: number;
}

// 2. Tipos para Ataques
export interface AttackItem {
  name: string;
  damage: string;
  graze: string;
  critical: string;
}

// 3. Tipos para Reducao de Dano (RD)
export interface RdSource {
  name: string;
  value: number;
}

export interface RdData {
  sources: RdSource[];
  blockBonus: number;
}

// 4. Tipos para Inventario
export type ItemType = 'CONSUMIVEL' | 'EQUIPAMENTO' | 'OUTRO';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  size: number;
  quantity: number;
  type: ItemType;
  equipped?: boolean;
}

// 5. Tipos para Notas de Investigacao (Post-its)
export interface NoteItem {
  id: string;
  x: number;
  y: number;
  text: string;
  imageUrl?: string;
  color: string;
  width: number;
  height: number;
}

// 6. Tipos para Poderes (Habilidades/Proezas)
export type PowerType = 'Acao' | 'Reacao' | 'Passivo' | 'Tecnica';

export interface PowerItem {
  name: string;
  type: PowerType;
  cost: string;
  description: string;
}

// 7. O Objeto Principal do Personagem (Raiz da Ficha)
export interface CharacterData {
  name: string;
  playerName: string;
  characterImage: string | null;
  
  stats: {
    body: number;
    senses: number;
    mind: number;
    soul: number;
  };
  
  hp: { current: number; max: number };
  determination: { current: number; max: number };
  
  rd: RdData;
  block: number;
  
  skills: SkillItem[];
  conditions: string[];
  
  attacks: AttackItem[];
  abilities: PowerItem[];
  feats: PowerItem[];
  
  notes: string;
  origin: string;
  investigationNotes: NoteItem[];
  inventory: InventoryItem[];
  credits: number;
}

// 8. Tipos para Usuarios (Admin)
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'GM' | 'PLAYER';
  avatar?: string | null;
  created_at?: string;
  password?: string; // Opcional, usado apenas na criacao/edicao
  createdAt?: string;
  updatedAt?: string;
}

// 9. Tipos para Documentos (Catalogo de PDFs)
export interface Document {
  id: string;
  name: string;
  version: string;
  coverImage: string;
  pdfFile: string;
  isWip: boolean;
  createdAt: string;
  updatedAt: string;
}
