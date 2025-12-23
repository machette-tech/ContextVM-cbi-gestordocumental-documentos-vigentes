/**
 * Máquina de Estados FSM - Documento Vigente
 * ContextVM: CBI Gestor Documental - Documentos Vigentes
 * 
 * Estados del ciclo de vida de un documento:
 * registro → validacion → aprobado → vigente → obsoleto
 *              ↓
 *          rechazado
 */

import { setup, assign, fromPromise } from 'xstate';
import type { DocumentoVigenteContext, DocumentoVigenteEvents } from '../types/documento.js';
import { logger } from '../utils/logger.js';

export const documentoVigenteMachine = setup({
  types: {
    context: {} as DocumentoVigenteContext,
    events: {} as DocumentoVigenteEvents,
  },
  actors: {
    guardarEnBD: fromPromise(async ({ input }: { input: DocumentoVigenteContext }) => {
      logger.info({ documentoId: input.token_id }, 'Guardando documento en BD');
      // La persistencia se maneja en el servicio
      return input;
    }),
    publicarEnNostr: fromPromise(async ({ input }: { input: any }) => {
      logger.info({ eventId: input.id }, 'Publicando evento en Nostr');
      // La publicación se maneja en el servicio
      return input;
    }),
  },
  guards: {
    tieneMetadatosCompletos: ({ context }) => {
      return !!(
        context.tipo_documento &&
        context.codigo &&
        context.nombre &&
        context.categoria &&
        context.formato &&
        context.version
      );
    },
    cumpleRequisitosLegales: ({ context }) => {
      // Validar requisitos según categoría
      if (context.categoria === 'fiscal' && (!context.requisitos_legales || context.requisitos_legales.length === 0)) {
        return false;
      }
      return true;
    },
    tieneVigencia: ({ context }) => {
      return !!context.vigencia_desde;
    },
  },
  actions: {
    asignarDatosIniciales: assign({
      tipo_documento: ({ event }) => event.tipo_documento,
      codigo: ({ event }) => event.codigo,
      nombre: ({ event }) => event.nombre,
      categoria: ({ event }) => event.categoria,
      formato: ({ event }) => event.formato,
      version: ({ event }) => event.version,
      descripcion: ({ event }) => event.descripcion,
      requisitos_legales: ({ event }) => event.requisitos_legales,
      campos_obligatorios: ({ event }) => event.campos_obligatorios,
      plantilla_url: ({ event }) => event.plantilla_url,
      metadata: ({ event }) => event.metadata,
      estado_actual: () => 'registro',
      fecha_creacion: () => new Date().toISOString(),
    }),
    marcarValidacionIniciada: assign({
      estado_actual: () => 'validacion',
      validador_id: ({ event }) => event.validador_id,
      fecha_validacion: () => new Date().toISOString(),
    }),
    marcarAprobado: assign({
      estado_actual: () => 'aprobado',
      aprobador_id: ({ event }) => event.aprobador_id,
      comentarios_aprobacion: ({ event }) => event.comentarios,
      fecha_aprobacion: () => new Date().toISOString(),
    }),
    marcarRechazado: assign({
      estado_actual: () => 'rechazado',
      motivo_rechazo: ({ event }) => event.motivo,
      rechazado_por: ({ event }) => event.rechazado_por,
      fecha_rechazo: () => new Date().toISOString(),
    }),
    marcarVigente: assign({
      estado_actual: () => 'vigente',
      vigencia_desde: ({ event }) => event.vigencia_desde || new Date().toISOString(),
      vigencia_hasta: ({ event }) => event.vigencia_hasta,
      activado_por: ({ event }) => event.activado_por,
      fecha_activacion: () => new Date().toISOString(),
    }),
    marcarObsoleto: assign({
      estado_actual: () => 'obsoleto',
      motivo_obsolescencia: ({ event }) => event.motivo,
      obsoleto_por: ({ event }) => event.obsoleto_por,
      fecha_obsolescencia: () => new Date().toISOString(),
      reemplazado_por: ({ event }) => event.reemplazado_por,
    }),
    registrarError: assign({
      error: ({ event }) => event.error,
    }),
  },
}).createMachine({
  id: 'documentoVigente',
  initial: 'registro',
  context: {
    token_id: '',
    instance_id: '',
    tipo_documento: '',
    codigo: '',
    nombre: '',
    categoria: '',
    formato: '',
    version: '',
    estado_actual: 'registro',
  },
  states: {
    registro: {
      description: 'Documento recién creado, captura de datos básicos',
      entry: ['asignarDatosIniciales'],
      on: {
        VALIDAR: {
          target: 'validacion',
          guard: 'tieneMetadatosCompletos',
          actions: ['marcarValidacionIniciada'],
        },
      },
    },
    
    validacion: {
      description: 'Validación de metadatos, estructura y requisitos legales',
      on: {
        APROBAR: {
          target: 'aprobado',
          guard: 'cumpleRequisitosLegales',
          actions: ['marcarAprobado'],
        },
        RECHAZAR: {
          target: 'rechazado',
          actions: ['marcarRechazado'],
        },
      },
    },
    
    rechazado: {
      description: 'Documento no cumple requisitos, requiere corrección',
      type: 'final',
      entry: ['registrarError'],
    },
    
    aprobado: {
      description: 'Documento validado, listo para activación',
      on: {
        ACTIVAR: {
          target: 'vigente',
          guard: 'tieneVigencia',
          actions: ['marcarVigente'],
        },
      },
    },
    
    vigente: {
      description: 'Documento activo y disponible para uso en procesos',
      on: {
        OBSOLETER: {
          target: 'obsoleto',
          actions: ['marcarObsoleto'],
        },
      },
    },
    
    obsoleto: {
      description: 'Documento reemplazado o fuera de uso',
      on: {
        REACTIVAR: {
          target: 'vigente',
          actions: ['marcarVigente'],
        },
      },
    },
  },
});

export type DocumentoVigenteMachine = typeof documentoVigenteMachine;
