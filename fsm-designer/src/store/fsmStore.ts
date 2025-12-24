import { create } from 'zustand';
import type { FSMDefinition, FSMState, FSMTransition, LEntity, SchemaField } from '../types/fsm';

interface FSMStore {
  // Estado actual del FSM
  currentFSM: FSMDefinition | null;
  
  // Entidad L
  entity: LEntity | null;
  setEntity: (entity: LEntity) => void;
  
  // Estados
  states: FSMState[];
  addState: (state: FSMState) => void;
  updateState: (id: string, updates: Partial<FSMState>) => void;
  removeState: (id: string) => void;
  
  // Transiciones
  transitions: FSMTransition[];
  addTransition: (transition: FSMTransition) => void;
  updateTransition: (id: string, updates: Partial<FSMTransition>) => void;
  removeTransition: (id: string) => void;
  
  // Schemas
  inputSchema: SchemaField[];
  outputSchema: SchemaField[];
  addInputField: (field: SchemaField) => void;
  addOutputField: (field: SchemaField) => void;
  updateInputField: (name: string, updates: Partial<SchemaField>) => void;
  updateOutputField: (name: string, updates: Partial<SchemaField>) => void;
  removeInputField: (name: string) => void;
  removeOutputField: (name: string) => void;
  
  // Metadata
  name: string;
  description: string;
  setName: (name: string) => void;
  setDescription: (description: string) => void;
  
  // Acciones
  loadFSM: (fsm: FSMDefinition) => void;
  resetFSM: () => void;
  exportFSM: () => FSMDefinition;
}

export const useFSMStore = create<FSMStore>((set, get) => ({
  currentFSM: null,
  entity: null,
  states: [],
  transitions: [],
  inputSchema: [],
  outputSchema: [],
  name: '',
  description: '',

  setEntity: (entity) => set({ entity }),

  addState: (state) => set((s) => ({ states: [...s.states, state] })),
  
  updateState: (id, updates) =>
    set((s) => ({
      states: s.states.map((state) =>
        state.id === id ? { ...state, ...updates } : state
      ),
    })),

  removeState: (id) =>
    set((s) => ({
      states: s.states.filter((state) => state.id !== id),
      transitions: s.transitions.filter((t) => t.from !== id && t.to !== id),
    })),

  addTransition: (transition) =>
    set((s) => ({ transitions: [...s.transitions, transition] })),

  updateTransition: (id, updates) =>
    set((s) => ({
      transitions: s.transitions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  removeTransition: (id) =>
    set((s) => ({
      transitions: s.transitions.filter((t) => t.id !== id),
    })),

  addInputField: (field) =>
    set((s) => ({ inputSchema: [...s.inputSchema, field] })),

  addOutputField: (field) =>
    set((s) => ({ outputSchema: [...s.outputSchema, field] })),

  updateInputField: (name, updates) =>
    set((s) => ({
      inputSchema: s.inputSchema.map((f) =>
        f.name === name ? { ...f, ...updates } : f
      ),
    })),

  updateOutputField: (name, updates) =>
    set((s) => ({
      outputSchema: s.outputSchema.map((f) =>
        f.name === name ? { ...f, ...updates } : f
      ),
    })),

  removeInputField: (name) =>
    set((s) => ({
      inputSchema: s.inputSchema.filter((f) => f.name !== name),
    })),

  removeOutputField: (name) =>
    set((s) => ({
      outputSchema: s.outputSchema.filter((f) => f.name !== name),
    })),

  setName: (name) => set({ name }),
  setDescription: (description) => set({ description }),

  loadFSM: (fsm) =>
    set({
      currentFSM: fsm,
      entity: fsm.entity,
      states: fsm.states,
      transitions: fsm.transitions,
      inputSchema: fsm.inputSchema,
      outputSchema: fsm.outputSchema,
      name: fsm.name,
      description: fsm.description,
    }),

  resetFSM: () =>
    set({
      currentFSM: null,
      entity: null,
      states: [],
      transitions: [],
      inputSchema: [],
      outputSchema: [],
      name: '',
      description: '',
    }),

  exportFSM: () => {
    const state = get();
    return {
      id: state.currentFSM?.id || crypto.randomUUID(),
      name: state.name,
      description: state.description,
      entity: state.entity!,
      states: state.states,
      transitions: state.transitions,
      inputSchema: state.inputSchema,
      outputSchema: state.outputSchema,
      version: (state.currentFSM?.version || 0) + 1,
      createdAt: state.currentFSM?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
  },
}));
