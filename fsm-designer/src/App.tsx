import React, { useEffect, useState } from 'react';
import { createBrowserInspector } from '@statelyai/inspect';
import { createActor } from 'xstate';
import './App.css';

const inspector = createBrowserInspector();

export const App: React.FC = () => {
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [actor, setActor] = useState<any>(null);
  const [context, setContext] = useState<any>(null);
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Fetch available machines from backend
    fetch('/api/machines')
      .then(res => res.json())
      .then(data => {
        setMachines(data.machines || []);
        if (data.machines && data.machines.length > 0) {
          setSelectedMachine(data.machines[0].id);
        }
      })
      .catch(err => {
        console.error('Error loading machines:', err);
        // Use default machine for development
        setMachines([{
          id: 'documento-vigente',
          name: 'Documento Vigente',
          description: 'FSM for managing document lifecycle'
        }]);
        setSelectedMachine('documento-vigente');
      });
  }, []);

  const loadMachine = async (machineId: string) => {
    try {
      // Fetch machine definition
      const response = await fetch(`/api/machines/${machineId}`);
      const machineDefinition = await response.json();

      // Create actor with inspector
      const newActor = createActor(machineDefinition, {
        inspect: inspector.inspect,
      });

      newActor.subscribe((snapshot) => {
        setState(snapshot.value as string);
        setContext(snapshot.context);
      });

      newActor.start();
      setActor(newActor);
      
    } catch (error) {
      console.error('Error loading machine:', error);
    }
  };

  useEffect(() => {
    if (selectedMachine) {
      loadMachine(selectedMachine);
    }
  }, [selectedMachine]);

  const sendEvent = (eventType: string, data?: any) => {
    if (actor) {
      actor.send({ type: eventType, ...data });
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🔄 FSM Designer - Documentos Vigentes</h1>
        <p>Visual State Machine Designer for ContextVM</p>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <div className="machine-selector">
            <h3>Máquinas de Estado</h3>
            <select
              value={selectedMachine}
              onChange={(e) => setSelectedMachine(e.target.value)}
            >
              {machines.map(machine => (
                <option key={machine.id} value={machine.id}>
                  {machine.name}
                </option>
              ))}
            </select>
          </div>

          {actor && (
            <div className="state-info">
              <h3>Estado Actual</h3>
              <div className="state-badge">{state}</div>
              
              <h3>Contexto</h3>
              <pre className="context-display">
                {JSON.stringify(context, null, 2)}
              </pre>
            </div>
          )}

          <div className="events-panel">
            <h3>Eventos Disponibles</h3>
            <button onClick={() => sendEvent('VALIDAR', { validador: 'test@example.com' })}>
              VALIDAR
            </button>
            <button onClick={() => sendEvent('RECHAZAR', { motivo_rechazo: 'Test reject', rechazado_por: 'test@example.com' })}>
              RECHAZAR
            </button>
            <button onClick={() => sendEvent('APROBAR', { aprobador: 'test@example.com' })}>
              APROBAR
            </button>
            <button onClick={() => sendEvent('ACTIVAR', { fecha_vigencia: new Date(), fecha_caducidad: new Date(Date.now() + 365*24*60*60*1000) })}>
              ACTIVAR
            </button>
            <button onClick={() => sendEvent('MARCAR_OBSOLETO', { motivo_obsolescencia: 'Test obsolete' })}>
              MARCAR_OBSOLETO
            </button>
          </div>
        </aside>

        <main className="main-content">
          <div className="inspector-container">
            <h3>📊 State Machine Visualization</h3>
            <p>Open the Stately Inspector in your browser to visualize the state machine:</p>
            <a 
              href="https://stately.ai/registry/inspect" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inspector-link"
            >
              🔗 Open Stately Inspector
            </a>
            
            <div className="info-panel">
              <h4>Estados del FSM:</h4>
              <ul>
                <li><strong>registro</strong>: Estado inicial, documento registrado</li>
                <li><strong>validacion</strong>: En proceso de validación</li>
                <li><strong>rechazado</strong>: Validación rechazada</li>
                <li><strong>aprobado</strong>: Validación aprobada, pendiente de activación</li>
                <li><strong>vigente</strong>: Documento activo y vigente</li>
                <li><strong>obsoleto</strong>: Documento obsoleto, sustituido por otro</li>
              </ul>

              <h4>Transiciones:</h4>
              <ul>
                <li><code>registro → validacion</code>: VALIDAR</li>
                <li><code>validacion → rechazado</code>: RECHAZAR</li>
                <li><code>validacion → aprobado</code>: APROBAR</li>
                <li><code>aprobado → vigente</code>: ACTIVAR</li>
                <li><code>vigente → obsoleto</code>: MARCAR_OBSOLETO</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
