/**
 * Database Service - PostgreSQL connection and queries
 */

import pg from 'pg';
import { logger } from '../utils/logger.js';
import type { NostrEvent } from 'nostr-tools';
import type { DocumentoVigenteContext } from '../types/documento.js';

const { Pool } = pg;

export class DatabaseService {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'contextvm_documentos',
      user: process.env.DB_USER || 'contextvm',
      password: process.env.DB_PASSWORD || 'contextvm123',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error({ error: err }, 'Database pool error');
    });
  }

  /**
   * Connect and verify
   */
  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      logger.info({ time: result.rows[0].now }, 'Database connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
      throw error;
    }
  }

  /**
   * Save Nostr event
   */
  async saveNostrEvent(event: NostrEvent): Promise<void> {
    const query = `
      INSERT INTO nostr_events (event_id, pubkey, created_at, kind, content, tags, sig, raw_event)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (event_id) DO NOTHING
    `;
    
    await this.pool.query(query, [
      event.id,
      event.pubkey,
      new Date(event.created_at * 1000),
      event.kind,
      event.content,
      JSON.stringify(event.tags),
      event.sig,
      JSON.stringify(event),
    ]);
    
    logger.debug({ eventId: event.id, kind: event.kind }, 'Event saved to database');
  }

  /**
   * Save documento state
   */
  async saveDocumento(context: DocumentoVigenteContext): Promise<void> {
    const query = `
      INSERT INTO documentos_vigentes (
        token_id, instance_id, tipo_documento, codigo, nombre, 
        categoria, formato, version, descripcion,
        requisitos_legales, campos_obligatorios, plantilla_url, metadata,
        estado_actual, fecha_creacion,
        validador_id, fecha_validacion,
        aprobador_id, comentarios_aprobacion, fecha_aprobacion,
        motivo_rechazo, rechazado_por, fecha_rechazo,
        vigencia_desde, vigencia_hasta, activado_por, fecha_activacion,
        motivo_obsolescencia, obsoleto_por, fecha_obsolescencia, reemplazado_por,
        error, updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, NOW()
      )
      ON CONFLICT (token_id) 
      DO UPDATE SET
        estado_actual = EXCLUDED.estado_actual,
        validador_id = EXCLUDED.validador_id,
        fecha_validacion = EXCLUDED.fecha_validacion,
        aprobador_id = EXCLUDED.aprobador_id,
        comentarios_aprobacion = EXCLUDED.comentarios_aprobacion,
        fecha_aprobacion = EXCLUDED.fecha_aprobacion,
        motivo_rechazo = EXCLUDED.motivo_rechazo,
        rechazado_por = EXCLUDED.rechazado_por,
        fecha_rechazo = EXCLUDED.fecha_rechazo,
        vigencia_desde = EXCLUDED.vigencia_desde,
        vigencia_hasta = EXCLUDED.vigencia_hasta,
        activado_por = EXCLUDED.activado_por,
        fecha_activacion = EXCLUDED.fecha_activacion,
        motivo_obsolescencia = EXCLUDED.motivo_obsolescencia,
        obsoleto_por = EXCLUDED.obsoleto_por,
        fecha_obsolescencia = EXCLUDED.fecha_obsolescencia,
        reemplazado_por = EXCLUDED.reemplazado_por,
        error = EXCLUDED.error,
        updated_at = NOW()
    `;

    await this.pool.query(query, [
      context.token_id,
      context.instance_id,
      context.tipo_documento,
      context.codigo,
      context.nombre,
      context.categoria,
      context.formato,
      context.version,
      context.descripcion,
      JSON.stringify(context.requisitos_legales || []),
      JSON.stringify(context.campos_obligatorios || []),
      context.plantilla_url,
      JSON.stringify(context.metadata || {}),
      context.estado_actual,
      context.fecha_creacion,
      context.validador_id,
      context.fecha_validacion,
      context.aprobador_id,
      context.comentarios_aprobacion,
      context.fecha_aprobacion,
      context.motivo_rechazo,
      context.rechazado_por,
      context.fecha_rechazo,
      context.vigencia_desde,
      context.vigencia_hasta,
      context.activado_por,
      context.fecha_activacion,
      context.motivo_obsolescencia,
      context.obsoleto_por,
      context.fecha_obsolescencia,
      context.reemplazado_por,
      context.error,
    ]);

    logger.debug({ tokenId: context.token_id, estado: context.estado_actual }, 'Documento saved to database');
  }

  /**
   * Get documento by token_id
   */
  async getDocumento(tokenId: string): Promise<DocumentoVigenteContext | null> {
    const query = 'SELECT * FROM documentos_vigentes WHERE token_id = $1';
    const result = await this.pool.query(query, [tokenId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToContext(result.rows[0]);
  }

  /**
   * List documentos with filters
   */
  async listDocumentos(filters: {
    categoria?: string;
    formato?: string;
    estado?: string;
  }): Promise<DocumentoVigenteContext[]> {
    let query = 'SELECT * FROM documentos_vigentes WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.categoria) {
      query += ` AND categoria = $${paramIndex++}`;
      params.push(filters.categoria);
    }

    if (filters.formato) {
      query += ` AND formato = $${paramIndex++}`;
      params.push(filters.formato);
    }

    if (filters.estado) {
      query += ` AND estado = $${paramIndex++}`;
      params.push(filters.estado);
    }

    query += ' ORDER BY fecha_registro DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map(row => this.mapRowToContext(row));
  }

  /**
   * Get metrics
   */
  async getMetrics(): Promise<any> {
    const queries = {
      total: 'SELECT COUNT(*) FROM documentos_vigentes',
      byEstado: 'SELECT estado, COUNT(*) FROM documentos_vigentes GROUP BY estado',
      byCategoria: 'SELECT categoria, COUNT(*) FROM documentos_vigentes GROUP BY categoria',
      vigentes: "SELECT COUNT(*) FROM documentos_vigentes WHERE estado = 'vigente'",
      obsoletos: "SELECT COUNT(*) FROM documentos_vigentes WHERE estado = 'obsoleto'",
    };

    const [total, byEstado, byCategoria, vigentes, obsoletos] = await Promise.all([
      this.pool.query(queries.total),
      this.pool.query(queries.byEstado),
      this.pool.query(queries.byCategoria),
      this.pool.query(queries.vigentes),
      this.pool.query(queries.obsoletos),
    ]);

    return {
      total: parseInt(total.rows[0].count),
      vigentes: parseInt(vigentes.rows[0].count),
      obsoletos: parseInt(obsoletos.rows[0].count),
      byEstado: byEstado.rows.reduce((acc, row) => {
        acc[row.estado] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      byCategoria: byCategoria.rows.reduce((acc, row) => {
        acc[row.categoria] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
    };
  }

  /**
   * Map database row to context
   */
  private mapRowToContext(row: any): DocumentoVigenteContext {
    return {
      token_id: row.token_id,
      instance_id: row.instance_id,
      tipo_documento: row.tipo_documento,
      codigo: row.codigo,
      nombre: row.nombre,
      categoria: row.categoria,
      formato: row.formato,
      version: row.version,
      descripcion: row.descripcion,
      requisitos_legales: row.requisitos_legales,
      campos_obligatorios: row.campos_obligatorios,
      plantilla_url: row.plantilla_url,
      metadata: row.metadata,
      estado_actual: row.estado_actual,
      fecha_creacion: row.fecha_creacion,
      validador_id: row.validador_id,
      fecha_validacion: row.fecha_validacion,
      aprobador_id: row.aprobador_id,
      comentarios_aprobacion: row.comentarios_aprobacion,
      fecha_aprobacion: row.fecha_aprobacion,
      motivo_rechazo: row.motivo_rechazo,
      rechazado_por: row.rechazado_por,
      fecha_rechazo: row.fecha_rechazo,
      vigencia_desde: row.vigencia_desde,
      vigencia_hasta: row.vigencia_hasta,
      activado_por: row.activado_por,
      fecha_activacion: row.fecha_activacion,
      motivo_obsolescencia: row.motivo_obsolescencia,
      obsoleto_por: row.obsoleto_por,
      fecha_obsolescencia: row.fecha_obsolescencia,
      reemplazado_por: row.reemplazado_por,
      error: row.error,
    };
  }

  /**
   * Disconnect
   */
  async disconnect(): Promise<void> {
    await this.pool.end();
    logger.info('Database disconnected');
  }
}
