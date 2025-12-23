/**
 * Tipos TypeScript para Documento Vigente
 * ContextVM: CBI Gestor Documental - Documentos Vigentes
 */

export type EstadoDocumento = 
  | 'registro'
  | 'validacion'
  | 'rechazado'
  | 'aprobado'
  | 'vigente'
  | 'obsoleto';

export type CategoriaDocumento = 
  | 'fiscal'
  | 'legal'
  | 'operativo'
  | 'contable'
  | 'laboral'
  | 'administrativo';

export type FormatoDocumento = 
  | 'PDF'
  | 'XML'
  | 'JSON'
  | 'DOCX'
  | 'XLSX'
  | 'TXT';

/**
 * Contexto de la máquina de estados
 */
export interface DocumentoVigenteContext {
  // Identificadores
  token_id: string;
  instance_id: string;
  
  // Datos básicos
  tipo_documento: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaDocumento | string;
  formato: FormatoDocumento | string;
  version: string;
  
  // Información adicional
  descripcion?: string;
  requisitos_legales?: string[];
  vigencia_desde?: string;
  vigencia_hasta?: string;
  campos_obligatorios?: string[];
  plantilla_url?: string;
  metadata?: Record<string, any>;
  
  // Estado y auditoría
  estado_actual: EstadoDocumento;
  fecha_creacion?: string;
  
  // Validación
  validador_id?: string;
  fecha_validacion?: string;
  
  // Aprobación
  aprobador_id?: string;
  comentarios_aprobacion?: string;
  fecha_aprobacion?: string;
  
  // Rechazo
  motivo_rechazo?: string;
  rechazado_por?: string;
  fecha_rechazo?: string;
  
  // Activación
  activado_por?: string;
  fecha_activacion?: string;
  
  // Obsolescencia
  motivo_obsolescencia?: string;
  obsoleto_por?: string;
  fecha_obsolescencia?: string;
  reemplazado_por?: string;
  
  // Error
  error?: string;
}

/**
 * Eventos de la máquina de estados
 */
export type DocumentoVigenteEvents =
  | { type: 'VALIDAR'; validador_id: string }
  | { type: 'APROBAR'; aprobador_id: string; comentarios?: string }
  | { type: 'RECHAZAR'; motivo: string; rechazado_por: string }
  | { type: 'ACTIVAR'; vigencia_desde?: string; vigencia_hasta?: string; activado_por: string }
  | { type: 'OBSOLETER'; motivo: string; obsoleto_por: string; reemplazado_por?: string }
  | { type: 'REACTIVAR'; activado_por: string }
  | { 
      type: 'CREAR';
      tipo_documento: string;
      codigo: string;
      nombre: string;
      categoria: CategoriaDocumento | string;
      formato: FormatoDocumento | string;
      version: string;
      descripcion?: string;
      requisitos_legales?: string[];
      campos_obligatorios?: string[];
      plantilla_url?: string;
      metadata?: Record<string, any>;
    }
  | { type: 'ERROR'; error: string };

/**
 * Datos de entrada para creación
 */
export interface CrearDocumentoInput {
  tipo_documento: string;
  codigo: string;
  nombre: string;
  categoria: CategoriaDocumento | string;
  formato: FormatoDocumento | string;
  version: string;
  descripcion?: string;
  requisitos_legales?: string[];
  campos_obligatorios?: string[];
  plantilla_url?: string;
  metadata?: Record<string, any>;
}

/**
 * Evento Nostr para documento
 */
export interface DocumentoNostrEvent {
  id: string;
  kind: 5055 | 6055;
  pubkey: string;
  created_at: number;
  content: string;
  tags: string[][];
  sig: string;
}

/**
 * Request de transición
 */
export interface TransicionRequest {
  token_id: string;
  instance_id: string;
  transicion: string;
  estado_inicial: EstadoDocumento;
  estado_final: EstadoDocumento;
  input?: Record<string, any>;
}

/**
 * Response de operación
 */
export interface DocumentoResponse {
  success: boolean;
  documento?: DocumentoVigenteContext;
  event_id?: string;
  error?: string;
}
