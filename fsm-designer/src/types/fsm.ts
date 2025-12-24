// Tipos de Eventos Nostr NIP-1
export interface NostrEvent {
  id?: string;
  kind: number;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig?: string;
}

// Tipos de Entidades L
export type EntityType = 'root' | 'context' | 'local';

export interface LEntity {
  name: string; // ej: cbz.tesoreria.pagos-ejecutados
  type: EntityType;
  description?: string;
  token?: {
    documentType: string;
    initialState: string;
  };
  sourceRelay?: string; // Para entidades de contexto
  sourceContextVM?: string;
  role?: string; // Para entidades locales
}

// Estados FSM
export interface FSMState {
  id: string;
  name: string;
  type: 'normal' | 'initial' | 'final';
  position?: { x: number; y: number };
}

// Transiciones FSM
export interface FSMTransition {
  id: string;
  from: string;
  to: string;
  action: string;
  label?: string;
}

// Tipos de Correlación
export type CorrelationType = 'none' | 'table' | 'data' | 'mandatory';

export interface FieldCorrelation {
  type: CorrelationType;
  sourceEntity?: string;
  sourceField?: string;
  sourceType?: 'input' | 'output' | 'instance';
  editable?: boolean;
}

// Campos de Schema
export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  defaultValue?: string | number | boolean;
  correlation?: FieldCorrelation;
}

// Definición completa de FSM
export interface FSMDefinition {
  id: string;
  name: string;
  description: string;
  entity: LEntity;
  states: FSMState[];
  transitions: FSMTransition[];
  inputSchema: SchemaField[];
  outputSchema: SchemaField[];
  version: number;
  createdAt: number;
  updatedAt: number;
}

// Token (Invariante)
export interface Token {
  id: string; // documentType#initialState
  documentType: string;
  initialState: string;
  entityName: string;
}

// Instancia de Proceso
export interface ProcessInstance {
  id: string;
  tokenId: string;
  currentState: string;
  status: 'active' | 'completed' | 'failed';
  data: Record<string, unknown>;
  correlations: Record<string, string>;
  createdAt: number;
  updatedAt: number;
}

// Configuración de Nostr
export interface NostrConfig {
  relayUrl: string;
  privateKey?: string;
  publicKey?: string;
}
