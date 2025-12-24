import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus, Upload, CheckCircle2 } from 'lucide-react';
import { useFSMStore } from '../store/fsmStore';
import { useNostr } from '../hooks/useNostr';
import { createFSMDefinitionEvent } from '../lib/nostr/events';
import type { FSMState } from '../types/fsm';
import { logger } from '../lib/logger';

export function FSMCanvas() {
  const { states, transitions, addState, addTransition, entity, inputSchema, outputSchema } = useFSMStore();
  const { publish, isConnected } = useNostr();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Convertir estados a nodos de React Flow
  const initialNodes: Node[] = states.map((state) => ({
    id: state.id,
    type: state.type === 'initial' ? 'input' : state.type === 'final' ? 'output' : 'default',
    position: state.position || { x: 0, y: 0 },
    data: { label: state.name },
    style: {
      background: state.type === 'initial' ? '#86efac' : state.type === 'final' ? '#fca5a5' : '#ddd',
      border: '2px solid #222',
      borderRadius: '8px',
      padding: '10px',
    },
  }));

  // Convertir transiciones a edges de React Flow
  const initialEdges: Edge[] = transitions.map((transition) => ({
    id: transition.id,
    source: transition.from,
    target: transition.to,
    label: transition.action,
    animated: true,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge = addEdge(connection, edges);
      setEdges(edge);
      
      if (connection.source && connection.target) {
        addTransition({
          id: `${connection.source}-${connection.target}`,
          from: connection.source,
          to: connection.target,
          action: 'transición',
        });
      }
    },
    [edges, setEdges, addTransition]
  );

  const handleAddState = () => {
    const newState: FSMState = {
      id: `state-${Date.now()}`,
      name: `Estado ${states.length + 1}`,
      type: states.length === 0 ? 'initial' : 'normal',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
    };
    
    addState(newState);
    
    const newNode: Node = {
      id: newState.id,
      type: newState.type === 'initial' ? 'input' : 'default',
      position: newState.position || { x: 0, y: 0 },
      data: { label: newState.name },
      style: {
        background: newState.type === 'initial' ? '#86efac' : '#ddd',
        border: '2px solid #222',
        borderRadius: '8px',
        padding: '10px',
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
  };

  const handlePublishToNostr = async () => {
    if (!entity) {
      alert('Primero define una entidad L');
      return;
    }

    if (states.length === 0) {
      alert('Agrega al menos un estado antes de publicar');
      return;
    }

    try {
      setIsPublishing(true);
      setPublishSuccess(false);

      const eventTemplate = createFSMDefinitionEvent(
        entity,
        states,
        transitions,
        inputSchema,
        outputSchema
      );

      const event = await publish(eventTemplate);
      
      if (event) {
        logger.success('FSM published to Nostr:', event.id);
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 3000);
      }
    } catch (error) {
      logger.error('Failed to publish FSM:', error);
      alert('Error al publicar en Nostr. Verifica la conexión.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
        
        <Panel position="top-left" className="bg-white p-2 rounded shadow-lg space-x-2">
          <button
            onClick={handleAddState}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={16} />
            Agregar Estado
          </button>
          
          <button
            onClick={handlePublishToNostr}
            disabled={!isConnected || isPublishing}
            className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
              publishSuccess
                ? 'bg-green-600 text-white'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={!isConnected ? 'Conecta al relay primero' : 'Publicar FSM en Nostr'}
          >
            {publishSuccess ? (
              <>
                <CheckCircle2 size={16} />
                Publicado
              </>
            ) : (
              <>
                <Upload size={16} />
                {isPublishing ? 'Publicando...' : 'Publicar'}
              </>
            )}
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
