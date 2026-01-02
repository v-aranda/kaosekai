// 1. Tipos para Perícias
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

// 3. Tipos para Redução de Dano (RD)
export interface RdSource {
  name: string;
  value: number;
}

export interface RdData {
  sources: RdSource[];
  blockBonus: number;
}

// 4. Tipos para Inventário
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

// 5. Tipos para Notas de Investigação (Post-its)
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
export type PowerType = 'Ação' | 'Reação' | 'Passivo' | 'Técnica';

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
  
  // rd corrigido de number para RdData (objeto)
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
// 8. Tipos para Usuários (Admin)
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'GM' | 'PLAYER';
  created_at?: string;
  password?: string; // Opcional, usado apenas na criação/edição

// 9. Tipos para Documentos (Catálogo de PDFs)
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
}
