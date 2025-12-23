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
    nombre: 'Test Document',
    descripcion: 'Test description',
    categoria: 'TECNICO',
    formato: 'PDF',
    version: '1.0.0',
    metadatos: { test: true },
    autor: 'test@example.com',
    organizacion: 'Test Org',
    estado: 'registro',
    fecha_registro: new Date(),
    requisitos_legales: [],
    tags: ['test'],
    vigente_desde: new Date(),
    vigente_hasta: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
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
      validador: 'validator@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('validacion');
    expect((snapshot.context as DocumentoVigenteContext).estado).toBe('validacion');
    expect((snapshot.context as DocumentoVigenteContext).validador).toBe('validator@example.com');
  });

  it('should transition from validacion to rechazado on RECHAZAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({
      type: 'VALIDAR',
      validador: 'validator@example.com',
    });
    
    actor.send({
      type: 'RECHAZAR',
      motivo_rechazo: 'Incomplete documentation',
      rechazado_por: 'validator@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('rechazado');
    expect((snapshot.context as DocumentoVigenteContext).estado).toBe('rechazado');
    expect((snapshot.context as DocumentoVigenteContext).motivo_rechazo).toBe('Incomplete documentation');
  });

  it('should transition from validacion to aprobado on APROBAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({
      type: 'VALIDAR',
      validador: 'validator@example.com',
    });
    
    actor.send({
      type: 'APROBAR',
      aprobador: 'approver@example.com',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('aprobado');
    expect((snapshot.context as DocumentoVigenteContext).estado).toBe('aprobado');
    expect((snapshot.context as DocumentoVigenteContext).aprobador).toBe('approver@example.com');
  });

  it('should transition from aprobado to vigente on ACTIVAR', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({ type: 'VALIDAR', validador: 'validator@example.com' });
    actor.send({ type: 'APROBAR', aprobador: 'approver@example.com' });
    
    const fechaVigencia = new Date();
    const fechaCaducidad = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    actor.send({
      type: 'ACTIVAR',
      fecha_vigencia: fechaVigencia,
      fecha_caducidad: fechaCaducidad,
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('vigente');
    expect((snapshot.context as DocumentoVigenteContext).estado).toBe('vigente');
    expect((snapshot.context as DocumentoVigenteContext).fecha_vigencia).toEqual(fechaVigencia);
  });

  it('should transition from vigente to obsoleto on MARCAR_OBSOLETO', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    actor.send({ type: 'VALIDAR', validador: 'validator@example.com' });
    actor.send({ type: 'APROBAR', aprobador: 'approver@example.com' });
    actor.send({
      type: 'ACTIVAR',
      fecha_vigencia: new Date(),
      fecha_caducidad: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    
    actor.send({
      type: 'MARCAR_OBSOLETO',
      sustituido_por: 'documento-vigente#registro#new',
      motivo_obsolescencia: 'Replaced by new version',
    });
    
    const snapshot = actor.getSnapshot();
    expect(snapshot.value).toBe('obsoleto');
    expect((snapshot.context as DocumentoVigenteContext).estado).toBe('obsoleto');
    expect((snapshot.context as DocumentoVigenteContext).sustituido_por).toBe('documento-vigente#registro#new');
  });

  it('should not allow invalid transitions', () => {
    const actor = createActor(documentoVigenteMachine, {
      input: createInitialContext(),
    });
    
    actor.start();
    
    // Try to go directly from registro to vigente (invalid)
    actor.send({
      type: 'ACTIVAR',
      fecha_vigencia: new Date(),
      fecha_caducidad: new Date(),
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
    
    actor.send({ type: 'VALIDAR', validador: 'validator@example.com' });
    
    const snapshot = actor.getSnapshot();
    const context = snapshot.context as DocumentoVigenteContext;
    
    // Check that initial data is preserved
    expect(context.token_id).toBe(initialContext.token_id);
    expect(context.nombre).toBe(initialContext.nombre);
    expect(context.categoria).toBe(initialContext.categoria);
    expect(context.autor).toBe(initialContext.autor);
  });
});
