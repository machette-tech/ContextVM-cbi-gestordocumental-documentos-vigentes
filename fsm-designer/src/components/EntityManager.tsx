import { useState } from 'react';
import { useFSMStore } from '../store/fsmStore';
import { Building2, Database, Table } from 'lucide-react';
import type { LEntity, EntityType } from '../types/fsm';

export function EntityManager() {
  const { entity, setEntity } = useFSMStore();
  const [isEditing, setIsEditing] = useState(!entity);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Gestión de Entidad L</h2>

      {!isEditing && entity ? (
        <EntityDisplay entity={entity} onEdit={() => setIsEditing(true)} />
      ) : (
        <EntityForm
          entity={entity}
          onSubmit={(newEntity) => {
            setEntity(newEntity);
            setIsEditing(false);
          }}
          onCancel={() => entity && setIsEditing(false)}
        />
      )}
    </div>
  );
}

interface EntityDisplayProps {
  entity: LEntity;
  onEdit: () => void;
}

function EntityDisplay({ entity, onEdit }: EntityDisplayProps) {
  const getIcon = () => {
    switch (entity.type) {
      case 'root':
        return <Building2 className="text-green-600" />;
      case 'context':
        return <Database className="text-blue-600" />;
      case 'local':
        return <Table className="text-purple-600" />;
    }
  };

  const getTypeLabel = () => {
    switch (entity.type) {
      case 'root':
        return 'Entidad Root';
      case 'context':
        return 'Entidad de Contexto';
      case 'local':
        return 'Entidad Local';
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="font-semibold text-lg">{entity.name}</h3>
            <span className="text-sm text-gray-600">{getTypeLabel()}</span>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
        >
          Editar
        </button>
      </div>

      {entity.description && (
        <p className="text-gray-700 mb-3">{entity.description}</p>
      )}

      {entity.token && (
        <div className="bg-gray-50 p-3 rounded space-y-1">
          <p className="text-sm font-medium">Token:</p>
          <p className="text-sm text-gray-700">
            Tipo: <span className="font-mono">{entity.token.documentType}</span>
          </p>
          <p className="text-sm text-gray-700">
            Estado Inicial: <span className="font-mono">{entity.token.initialState}</span>
          </p>
        </div>
      )}

      {entity.sourceRelay && (
        <div className="bg-blue-50 p-3 rounded mt-3">
          <p className="text-sm font-medium mb-1">Fuente Externa:</p>
          <p className="text-sm text-gray-700">
            Relay: <span className="font-mono text-xs">{entity.sourceRelay}</span>
          </p>
          {entity.sourceContextVM && (
            <p className="text-sm text-gray-700">
              ContextVM: <span className="font-mono">{entity.sourceContextVM}</span>
            </p>
          )}
        </div>
      )}

      {entity.role && (
        <div className="bg-purple-50 p-3 rounded mt-3">
          <p className="text-sm font-medium">Rol: <span className="font-mono">{entity.role}</span></p>
        </div>
      )}
    </div>
  );
}

interface EntityFormProps {
  entity: LEntity | null;
  onSubmit: (entity: LEntity) => void;
  onCancel: () => void;
}

function EntityForm({ entity, onSubmit, onCancel }: EntityFormProps) {
  const [name, setName] = useState(entity?.name || '');
  const [type, setType] = useState<EntityType>(entity?.type || 'root');
  const [description, setDescription] = useState(entity?.description || '');
  const [documentType, setDocumentType] = useState(entity?.token?.documentType || '');
  const [initialState, setInitialState] = useState(entity?.token?.initialState || '');
  const [sourceRelay, setSourceRelay] = useState(entity?.sourceRelay || '');
  const [sourceContextVM, setSourceContextVM] = useState(entity?.sourceContextVM || '');
  const [role, setRole] = useState(entity?.role || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newEntity: LEntity = {
      name,
      type,
      description: description || undefined,
      token: type === 'root' && documentType && initialState ? {
        documentType,
        initialState,
      } : undefined,
      sourceRelay: type === 'context' && sourceRelay ? sourceRelay : undefined,
      sourceContextVM: type === 'context' && sourceContextVM ? sourceContextVM : undefined,
      role: type === 'local' && role ? role : undefined,
    };

    onSubmit(newEntity);
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 bg-white space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre de la Entidad</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej: cbz.tesoreria.pagos-ejecutados"
          className="w-full px-3 py-2 border rounded"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          Formato: dominio.subdominio.contexto-proceso
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Entidad</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EntityType)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="root">Root (Entidad Principal)</option>
          <option value="context">Context (Importada de otro ContextVM)</option>
          <option value="local">Local (Catálogo interno)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={2}
        />
      </div>

      {type === 'root' && (
        <div className="bg-green-50 p-4 rounded space-y-3">
          <h4 className="font-medium">Token (Invariante)</h4>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Documento</label>
            <input
              type="text"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="ej: pago-tesoreria"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado Inicial</label>
            <input
              type="text"
              value={initialState}
              onChange={(e) => setInitialState(e.target.value)}
              placeholder="ej: planificado"
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        </div>
      )}

      {type === 'context' && (
        <div className="bg-blue-50 p-4 rounded space-y-3">
          <h4 className="font-medium">Fuente Externa</h4>
          <div>
            <label className="block text-sm font-medium mb-1">URL del Relay</label>
            <input
              type="text"
              value={sourceRelay}
              onChange={(e) => setSourceRelay(e.target.value)}
              placeholder="wss://relay.example.com"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ContextVM Fuente</label>
            <input
              type="text"
              value={sourceContextVM}
              onChange={(e) => setSourceContextVM(e.target.value)}
              placeholder="ej: FacturasVentaRegistradas"
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      )}

      {type === 'local' && (
        <div className="bg-purple-50 p-4 rounded">
          <label className="block text-sm font-medium mb-1">Rol con Permisos</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="ej: ADMINISTRADOR_TESORERIA"
            className="w-full px-3 py-2 border rounded"
          />
          <p className="text-xs text-gray-600 mt-1">
            Usuario con permisos de escritura independientes
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Guardar Entidad
        </button>
        {entity && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
