import { useState } from 'react';
import { useFSMStore } from '../store/fsmStore';
import { Plus, Trash2 } from 'lucide-react';
import type { SchemaField, CorrelationType } from '../types/fsm';

export function SchemaBuilder() {
  const {
    inputSchema,
    outputSchema,
    addInputField,
    addOutputField,
    removeInputField,
    removeOutputField,
  } = useFSMStore();

  const [showInputForm, setShowInputForm] = useState(false);
  const [showOutputForm, setShowOutputForm] = useState(false);

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold">Constructor de Esquemas</h2>

      {/* Campos de Entrada */}
      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Campos de Entrada</h3>
          <button
            onClick={() => setShowInputForm(!showInputForm)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {showInputForm && (
          <FieldForm
            onSubmit={(field) => {
              addInputField(field);
              setShowInputForm(false);
            }}
            onCancel={() => setShowInputForm(false)}
          />
        )}

        <div className="space-y-2 mt-4">
          {inputSchema.map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              onDelete={() => removeInputField(field.name)}
            />
          ))}
          {inputSchema.length === 0 && (
            <p className="text-gray-500 text-sm">No hay campos de entrada definidos</p>
          )}
        </div>
      </section>

      {/* Campos de Salida */}
      <section className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Campos de Salida</h3>
          <button
            onClick={() => setShowOutputForm(!showOutputForm)}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>

        {showOutputForm && (
          <FieldForm
            onSubmit={(field) => {
              addOutputField(field);
              setShowOutputForm(false);
            }}
            onCancel={() => setShowOutputForm(false)}
          />
        )}

        <div className="space-y-2 mt-4">
          {outputSchema.map((field) => (
            <FieldRow
              key={field.name}
              field={field}
              onDelete={() => removeOutputField(field.name)}
            />
          ))}
          {outputSchema.length === 0 && (
            <p className="text-gray-500 text-sm">No hay campos de salida definidos</p>
          )}
        </div>
      </section>
    </div>
  );
}

interface FieldFormProps {
  onSubmit: (field: SchemaField) => void;
  onCancel: () => void;
}

function FieldForm({ onSubmit, onCancel }: FieldFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'string' | 'number' | 'boolean' | 'date'>('string');
  const [required, setRequired] = useState(false);
  const [correlationType, setCorrelationType] = useState<CorrelationType>('none');
  const [sourceEntity, setSourceEntity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const field: SchemaField = {
      name,
      type,
      required,
      correlation: correlationType !== 'none' ? {
        type: correlationType,
        sourceEntity: sourceEntity || undefined,
        editable: correlationType === 'data',
      } : undefined,
    };

    onSubmit(field);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Nombre del Campo</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'string' | 'number' | 'boolean' | 'date')}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="string">Texto</option>
          <option value="number">Número</option>
          <option value="boolean">Booleano</option>
          <option value="date">Fecha</option>
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="required"
          checked={required}
          onChange={(e) => setRequired(e.target.checked)}
        />
        <label htmlFor="required" className="text-sm">Campo obligatorio</label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Tipo de Correlación</label>
        <select
          value={correlationType}
          onChange={(e) => setCorrelationType(e.target.value as CorrelationType)}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="none">Sin correlación</option>
          <option value="table">Tabla de consulta</option>
          <option value="data">Referencia de datos</option>
          <option value="mandatory">Correlación obligatoria</option>
        </select>
      </div>

      {correlationType !== 'none' && (
        <div>
          <label className="block text-sm font-medium mb-1">Entidad Fuente</label>
          <input
            type="text"
            value={sourceEntity}
            onChange={(e) => setSourceEntity(e.target.value)}
            placeholder="ej: cbz.tesoreria.facturas-venta"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Guardar
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

interface FieldRowProps {
  field: SchemaField;
  onDelete: () => void;
}

function FieldRow({ field, onDelete }: FieldRowProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-white border rounded">
      <div>
        <span className="font-medium">{field.name}</span>
        <span className="text-sm text-gray-500 ml-2">({field.type})</span>
        {field.required && (
          <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
            Obligatorio
          </span>
        )}
        {field.correlation && field.correlation.type !== 'none' && (
          <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
            {field.correlation.type}
          </span>
        )}
      </div>
      <button
        onClick={onDelete}
        className="text-red-500 hover:text-red-700"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
