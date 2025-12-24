/**
 * Unit tests for documento-vigente.machine
 */

import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { documentoVigenteMachine } from '../src/machines/documento-vigente.machine.js';
import type { DocumentoVigenteContext } from '../src/types/documento.js';

describe('DocumentoVigenteMachine', () => {
  const createInitialContext = (): DocumentoVigenteContext => ({
    token_id: 'documento-vigente#registro#test',
    instance_id: 'test-instance-1',
    tipo_documento: 'Manual',
    codigo: 'MAN-001',
    nombre: 'Test Document',
    descripcion: 'Test description',
    categoria: 'tecnico',
    formato: 'PDF',
    version: '1.0.0',
    metadata: { test: true },
    estado_actual: 'registro',
    fecha_creacion: new Date().toISOString(),
    requisitos_legales: [],
    vigencia_desde: new Date().toISOString(),
    vigencia_hasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  });

  it('should start in registro state', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    expect(actor.getSnapshot().value).toBe('registro');
  });

  it('should transition from registro to validacion on VALIDAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({
      type: 'VALIDAR',
      validador_id: 'validator@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('validacion');
    expect((snapshot.context as DocumentoVigenteContext).estado_actual).toBe('validacion');
    expect((snapshot.context as DocumentoVigenteContext).validador_id).toBe('validator@example.com');
  });

  it('should transition from validacion to rechazado on RECHAZAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({
      type: 'VALIDAR',
      validador_id: 'validator@example.com',
    });
    
    actor.send({
      type: 'RECHAZAR',
      motivo: 'Incomplete documentation',
      rechazado_por: 'validator@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('rechazado');
    expect((snapshot.context as DocumentoVigenteContext).estado_actual).toBe('rechazado');
    expect((snapshot.context as DocumentoVigenteContext).motivo_rechazo).toBe('Incomplete documentation');
  });

  it('should transition from validacion to aprobado on APROBAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({
      type: 'VALIDAR',
      validador_id: 'validator@example.com',
    });
    
    actor.send({
      type: 'APROBAR',
      aprobador_id: 'approver@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('aprobado');
    expect((snapshot.context as DocumentoVigenteContext).estado_actual).toBe('aprobado');
    expect((snapshot.context as DocumentoVigenteContext).aprobador_id).toBe('approver@example.com');
  });

  it('should transition from aprobado to vigente on ACTIVAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({ type: 'VALIDAR', validador_id: 'validator@example.com' });
    actor.send({ type: 'APROBAR', aprobador_id: 'approver@example.com' });
    
    const vigenciaDesde = new Date().toISOString();
    const vigenciaHasta = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    
    actor.send({
      type: 'ACTIVAR',
      vigencia_desde: vigenciaDesde,
      vigencia_hasta: vigenciaHasta,
      activado_por: 'admin@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('vigente');
    expect((snapshot.context as DocumentoVigenteContext).estado_actual).toBe('vigente');
  });

  it('should transition from vigente to obsoleto on MARCAR_OBSOLETO', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({ type: 'VALIDAR', validador_id: 'validator@example.com' });
    actor.send({ type: 'APROBAR', aprobador_id: 'approver@example.com' });
    actor.send({
      type: 'ACTIVAR',
      vigencia_desde: new Date().toISOString(),
      vigencia_hasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      activado_por: 'admin@example.com',
    });
    
    actor.send({
      type: 'OBSOLETER',
      motivo: 'Replaced by new version',
      obsoleto_por: 'admin@example.com',
      reemplazado_por: 'documento-vigente#registro#new',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('obsoleto');
    expect((snapshot.context as DocumentoVigenteContext).estado_actual).toBe('obsoleto');
  });

  it('should not allow invalid transitions', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    // Try to go directly from registro to vigente (invalid)
    actor.send({
      type: 'ACTIVAR',
      vigencia_desde: new Date().toISOString(),
      vigencia_hasta: new Date().toISOString(),
      activado_por: 'admin@example.com',
    });
    
    // Should still be in registro
    expect(actor.getSnapshot().value).toBe('registro');
  });

  it('should preserve context data through transitions', () => {
    const initialContext = createInitialContext();
    const actor = createActor(documentoVigenteMachine, {
      input: initialContext,
    });
    
    actor.start();
    
    actor.send({ type: 'VALIDAR', validador_id: 'validator@example.com' });
    
    const snapshot = actor.getSnapshot();
    const context = snapshot.context as DocumentoVigenteContext;
    
    // Check that initial data is preserved
    expect(context.token_id).toBe(initialContext.token_id);
    expect(context.nombre).toBe(initialContext.nombre);
    expect(context.categoria).toBe(initialContext.categoria);
  });
});
