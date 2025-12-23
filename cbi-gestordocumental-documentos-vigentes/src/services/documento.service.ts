/**
 * Documento Service - Business logic for documento management
 */

import { createActor } from 'xstate';
import { documentoVigenteMachine } from '../machines/documento-vigente.machine.js';
import { NostrService } from './nostr.service.js';
import { DatabaseService } from './database.service.js';
import { logger } from '../utils/logger.js';
import type {
  DocumentoVigenteContext,
  CrearDocumentoInput,
  DocumentoVigenteEvents,
} from '../types/documento.js';

export class DocumentoService {
  private actors: Map<string, any> = new Map();
  private nostrService: NostrService;
  private dbService: DatabaseService;

  constructor(nostrService: NostrService, dbService: DatabaseService) {
    this.nostrService = nostrService;
    this.dbService = dbService;
  }

  /**
   * Initialize service
   */
  async initialize(): Promise<void> {
    // Subscribe to incoming requests (kind 5055)
    this.nostrService.subscribe(
      [{ kinds: [5055], '#p': [this.nostrService.getPublicKey()] }],
      async (event) => {
        await this.handleNostrRequest(event);
      },
      'documento-requests'
    );

    logger.info('Documento service initialized, listening for requests');
  }

  /**
   * Handle Nostr request
   */
  private async handleNostrRequest(event: any): Promise<void> {
    try {
      logger.info({ eventId: event.id, content: event.content }, 'Handling Nostr request');

      const request = JSON.parse(event.content);
      const { action, token_id, data } = request;

      let result;

      switch (action) {
        case 'create':
          result = await this.crearDocumento(data);
          break;
        case 'transition':
          result = await this.ejecutarTransicion(token_id, data.transition, data);
          break;
        case 'get':
          const doc = await this.getDocumento(token_id);
          result = { success: !!doc, documento: doc };
          break;
        case 'list':
          const docs = await this.listarDocumentos(data || {});
          result = { success: true, documentos: docs };
          break;
        default:
          result = { success: false, error: `Unknown action: ${action}` };
      }

      // Publish response (kind 6055)
      await this.publishResponse(event.id, event.pubkey, result);
    } catch (error) {
      logger.error({ error, eventId: event.id }, 'Error handling Nostr request');
      await this.publishResponse(event.id, event.pubkey, {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Publish response
   */
  private async publishResponse(requestId: string, recipientPubkey: string, result: any): Promise<void> {
    await this.nostrService.publishEvent({
      kind: 6055,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['e', requestId],
        ['p', recipientPubkey],
        ['context_root', process.env.CONTEXT_NAMESPACE || 'cbi-gestordocumental-documentos-vigentes'],
      ],
      content: JSON.stringify(result),
      pubkey: this.nostrService.getPublicKey(),
    });
  }

  /**
   * Create new documento
   */
  async crearDocumento(input: CrearDocumentoInput): Promise<any> {
    try {
      // Generate token_id
      const tokenId = `documento-vigente#registro#${Date.now()}`;

      // Create initial context
      const initialContext: DocumentoVigenteContext = {
        token_id: tokenId,
        nombre: input.nombre,
        descripcion: input.descripcion,
        categoria: input.categoria,
        formato: input.formato,
        version: input.version || '1.0.0',
        metadatos: input.metadatos || {},
        autor: input.autor,
        organizacion: input.organizacion || process.env.ORGANIZATION_NAME || '',
        estado: 'registro',
        fecha_registro: new Date(),
        requisitos_legales: input.requisitos_legales || [],
        tags: input.tags || [],
        vigente_desde: input.vigente_desde,
        vigente_hasta: input.vigente_hasta,
        ubicacion_fisica: input.ubicacion_fisica,
      };

      // Create actor
      const actor = createActor(documentoVigenteMachine, {
        input: initialContext,
      });

      // Subscribe to state changes
      actor.subscribe((state) => {
        logger.info({ tokenId, estado: state.value }, 'State changed');
        this.saveState(tokenId, state.context as DocumentoVigenteContext);
      });

      actor.start();

      // Store actor
      this.actors.set(tokenId, actor);

      // Save to database
      await this.dbService.saveDocumento(initialContext);

      // Publish to Nostr
      const event = await this.nostrService.publishEvent({
        kind: 5055,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['context_root', process.env.CONTEXT_NAMESPACE || 'cbi-gestordocumental-documentos-vigentes'],
          ['token_id', tokenId],
          ['action', 'created'],
          ['estado', 'registro'],
        ],
        content: JSON.stringify(initialContext),
        pubkey: this.nostrService.getPublicKey(),
      });

      return {
        success: true,
        token_id: tokenId,
        estado: 'registro',
        event_id: event.id,
      };
    } catch (error) {
      logger.error({ error, input }, 'Error creating documento');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute transition
   */
  async ejecutarTransicion(tokenId: string, transition: string, data: any = {}): Promise<any> {
    try {
      // Get or create actor
      let actor = this.actors.get(tokenId);

      if (!actor) {
        // Load from database
        const documento = await this.dbService.getDocumento(tokenId);
        if (!documento) {
          return { success: false, error: 'Documento not found' };
        }

        actor = createActor(documentoVigenteMachine, {
          input: documento,
        });

        actor.subscribe((state) => {
          this.saveState(tokenId, state.context as DocumentoVigenteContext);
        });

        actor.start();
        this.actors.set(tokenId, actor);
      }

      // Send event
      const eventMap: Record<string, any> = {
        validar: { type: 'VALIDAR', validador: data.validador },
        rechazar: { type: 'RECHAZAR', motivo_rechazo: data.motivo_rechazo, rechazado_por: data.rechazado_por },
        aprobar: { type: 'APROBAR', aprobador: data.aprobador },
        activar: { type: 'ACTIVAR', fecha_vigencia: data.fecha_vigencia, fecha_caducidad: data.fecha_caducidad },
        marcar_obsoleto: {
          type: 'MARCAR_OBSOLETO',
          sustituido_por: data.sustituido_por,
          motivo_obsolescencia: data.motivo_obsolescencia,
        },
      };

      const event = eventMap[transition];
      if (!event) {
        return { success: false, error: `Unknown transition: ${transition}` };
      }

      actor.send(event);

      // Get current state
      const snapshot = actor.getSnapshot();
      const context = snapshot.context as DocumentoVigenteContext;

      // Publish to Nostr
      const nostrEvent = await this.nostrService.publishEvent({
        kind: 5055,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['context_root', process.env.CONTEXT_NAMESPACE || 'cbi-gestordocumental-documentos-vigentes'],
          ['token_id', tokenId],
          ['action', 'transition'],
          ['transition', transition],
          ['estado', context.estado],
        ],
        content: JSON.stringify({ transition, data, context }),
        pubkey: this.nostrService.getPublicKey(),
      });

      return {
        success: true,
        token_id: tokenId,
        estado: context.estado,
        event_id: nostrEvent.id,
      };
    } catch (error) {
      logger.error({ error, tokenId, transition }, 'Error executing transition');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Save state to database
   */
  private async saveState(tokenId: string, context: DocumentoVigenteContext): Promise<void> {
    try {
      await this.dbService.saveDocumento(context);
      logger.debug({ tokenId, estado: context.estado }, 'State saved');
    } catch (error) {
      logger.error({ error, tokenId }, 'Error saving state');
    }
  }

  /**
   * Get documento
   */
  async getDocumento(tokenId: string): Promise<DocumentoVigenteContext | null> {
    return await this.dbService.getDocumento(tokenId);
  }

  /**
   * List documentos
   */
  async listarDocumentos(filters: {
    categoria?: string;
    formato?: string;
    estado?: string;
  }): Promise<DocumentoVigenteContext[]> {
    return await this.dbService.listDocumentos(filters);
  }

  /**
   * Get metrics
   */
  async getMetrics(): Promise<any> {
    return await this.dbService.getMetrics();
  }
}
