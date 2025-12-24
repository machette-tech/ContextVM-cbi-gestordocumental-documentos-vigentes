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
import type { DocumentoVigenteContext, DocumentoVigenteEvents, EstadoDocumento } from '../types/documento.js';
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
    asignarDatosIniciales: assign(({ event }) => {
      if (event.type !== 'CREAR') return {};
      return {
        tipo_documento: event.tipo_documento,
        codigo: event.codigo,
        nombre: event.nombre,
        categoria: event.categoria,
        formato: event.formato,
        version: event.version,
        descripcion: event.descripcion,
        requisitos_legales: event.requisitos_legales,
        campos_obligatorios: event.campos_obligatorios,
        plantilla_url: event.plantilla_url,
        metadata: event.metadata,
        estado_actual: 'registro' as EstadoDocumento,
        fecha_creacion: new Date().toISOString(),
      };
    }),
    marcarValidacionIniciada: assign(({ event }) => {
      if (event.type !== 'VALIDAR') return {};
      return {
        estado_actual: 'validacion' as EstadoDocumento,
        validador_id: event.validador_id,
        fecha_validacion: new Date().toISOString(),
      };
    }),
    marcarAprobado: assign(({ event }) => {
      if (event.type !== 'APROBAR') return {};
      return {
        estado_actual: 'aprobado' as EstadoDocumento,
        aprobador_id: event.aprobador_id,
        comentarios_aprobacion: event.comentarios,
        fecha_aprobacion: new Date().toISOString(),
      };
    }),
    marcarRechazado: assign(({ event }) => {
      if (event.type !== 'RECHAZAR') return {};
      return {
        estado_actual: 'rechazado' as EstadoDocumento,
        motivo_rechazo: event.motivo,
        rechazado_por: event.rechazado_por,
        fecha_rechazo: new Date().toISOString(),
      };
    }),
    marcarVigente: assign(({ event }) => {
      if (event.type !== 'ACTIVAR' && event.type !== 'REACTIVAR') return {};
      if (event.type === 'ACTIVAR') {
        return {
          estado_actual: 'vigente' as EstadoDocumento,
          vigencia_desde: event.vigencia_desde || new Date().toISOString(),
          vigencia_hasta: event.vigencia_hasta,
          activado_por: event.activado_por,
          fecha_activacion: new Date().toISOString(),
        };
      }
      return {
        estado_actual: 'vigente' as EstadoDocumento,
        activado_por: event.activado_por,
        fecha_activacion: new Date().toISOString(),
      };
    }),
    marcarObsoleto: assign(({ event }) => {
      if (event.type !== 'OBSOLETER') return {};
      return {
        estado_actual: 'obsoleto' as EstadoDocumento,
        motivo_obsolescencia: event.motivo,
        obsoleto_por: event.obsoleto_por,
        fecha_obsolescencia: new Date().toISOString(),
        reemplazado_por: event.reemplazado_por,
      };
    }),
    registrarError: assign(({ event }) => {
      if (event.type !== 'ERROR') return {};
      return {
        error: event.error,
      };
    }),
  },
}).createMachine({
  id: 'documentoVigente',
  initial: 'registro',
  context: ({ input }) => ({
    ...(input || {}),
    token_id: input?.token_id || '',
    instance_id: input?.instance_id || '',
    tipo_documento: input?.tipo_documento || '',
    codigo: input?.codigo || '',
    nombre: input?.nombre || '',
    categoria: input?.categoria || '',
    formato: input?.formato || '',
    version: input?.version || '',
    estado_actual: input?.estado_actual || 'registro',
  }),
  states: {
    registro: {
      description: 'Documento recién creado, captura de datos básicos',
      on: {
        CREAR: {
          actions: ['asignarDatosIniciales'],
        },
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
