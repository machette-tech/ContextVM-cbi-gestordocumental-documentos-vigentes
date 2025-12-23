# Ejemplo: Crear y Gestionar un Documento

Este documento muestra el flujo completo de creación y gestión de un documento en el sistema.

## 1. Crear un Nuevo Documento

### Request HTTP:
```bash
curl -X POST http://localhost:3004/documentos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Manual de Procedimientos de Calidad ISO 9001",
    "descripcion": "Manual que define los procedimientos de calidad según norma ISO 9001:2015",
    "categoria": "CALIDAD",
    "formato": "PDF",
    "version": "1.0.0",
    "autor": "juan.perez@machette.tech",
    "organizacion": "Machette Tech",
    "metadatos": {
      "norma_aplicable": "ISO 9001:2015",
      "departamento": "Calidad",
      "confidencialidad": "Interno"
    },
    "requisitos_legales": [
      "Cumplimiento ISO 9001:2015",
      "Aprobación Dirección Calidad"
    ],
    "tags": ["calidad", "iso9001", "procedimientos"],
    "vigente_desde": "2024-01-01",
    "vigente_hasta": "2025-12-31",
    "ubicacion_fisica": "Servidor Documentos/Calidad/Manuales/"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "registro",
  "event_id": "abc123...xyz"
}
```

### Evento Publicado en Nostr:
```json
{
  "id": "abc123...xyz",
  "kind": 5055,
  "pubkey": "...",
  "created_at": 1703348400,
  "tags": [
    ["context_root", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "documento-vigente#registro#1703348400000"],
    ["action", "created"],
    ["estado", "registro"]
  ],
  "content": "{...documento data...}",
  "sig": "..."
}
```

## 2. Validar el Documento

Un validador revisa el documento y lo valida:

```bash
curl -X POST http://localhost:3004/documentos/documento-vigente#registro#1703348400000/transitions/validar \
  -H "Content-Type: application/json" \
  -d '{
    "validador": "maria.gomez@machette.tech"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "validacion",
  "event_id": "def456...xyz"
}
```

## 3. Aprobar el Documento

El responsable aprueba el documento:

```bash
curl -X POST http://localhost:3004/documentos/documento-vigente#registro#1703348400000/transitions/aprobar \
  -H "Content-Type: application/json" \
  -d '{
    "aprobador": "director.calidad@machette.tech"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "aprobado",
  "event_id": "ghi789...xyz"
}
```

## 4. Activar como Vigente

Se activa el documento con fechas de vigencia:

```bash
curl -X POST http://localhost:3004/documentos/documento-vigente#registro#1703348400000/transitions/activar \
  -H "Content-Type: application/json" \
  -d '{
    "fecha_vigencia": "2024-01-01T00:00:00Z",
    "fecha_caducidad": "2025-12-31T23:59:59Z"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "vigente",
  "event_id": "jkl012...xyz"
}
```

## 5. Consultar Documento

Obtener el estado actual del documento:

```bash
curl http://localhost:3004/documentos/documento-vigente#registro#1703348400000
```

### Response:
```json
{
  "success": true,
  "documento": {
    "token_id": "documento-vigente#registro#1703348400000",
    "nombre": "Manual de Procedimientos de Calidad ISO 9001",
    "descripcion": "Manual que define los procedimientos de calidad según norma ISO 9001:2015",
    "categoria": "CALIDAD",
    "formato": "PDF",
    "version": "1.0.0",
    "autor": "juan.perez@machette.tech",
    "organizacion": "Machette Tech",
    "estado": "vigente",
    "fecha_registro": "2023-12-23T10:00:00Z",
    "fecha_validacion": "2023-12-23T11:00:00Z",
    "validador": "maria.gomez@machette.tech",
    "fecha_aprobacion": "2023-12-23T12:00:00Z",
    "aprobador": "director.calidad@machette.tech",
    "fecha_vigencia": "2024-01-01T00:00:00Z",
    "fecha_caducidad": "2025-12-31T23:59:59Z",
    "metadatos": {
      "norma_aplicable": "ISO 9001:2015",
      "departamento": "Calidad",
      "confidencialidad": "Interno"
    },
    "requisitos_legales": [
      "Cumplimiento ISO 9001:2015",
      "Aprobación Dirección Calidad"
    ],
    "tags": ["calidad", "iso9001", "procedimientos"],
    "vigente_desde": "2024-01-01",
    "vigente_hasta": "2025-12-31",
    "ubicacion_fisica": "Servidor Documentos/Calidad/Manuales/"
  }
}
```

## 6. Listar Documentos Vigentes

Consultar todos los documentos vigentes de categoría CALIDAD:

```bash
curl "http://localhost:3004/documentos?categoria=CALIDAD&estado=vigente"
```

### Response:
```json
{
  "success": true,
  "documentos": [
    {
      "token_id": "documento-vigente#registro#1703348400000",
      "nombre": "Manual de Procedimientos de Calidad ISO 9001",
      "categoria": "CALIDAD",
      "estado": "vigente",
      "fecha_vigencia": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

## 7. Marcar como Obsoleto

Cuando sale una nueva versión, se marca la anterior como obsoleta:

```bash
curl -X POST http://localhost:3004/documentos/documento-vigente#registro#1703348400000/transitions/marcar_obsoleto \
  -H "Content-Type: application/json" \
  -d '{
    "sustituido_por": "documento-vigente#registro#1703434800000",
    "motivo_obsolescencia": "Sustituido por versión 2.0.0 que incluye cambios normativos"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "obsoleto",
  "event_id": "mno345...xyz"
}
```

## 8. Rechazar un Documento

Si durante la validación se encuentra un problema:

```bash
curl -X POST http://localhost:3004/documentos/documento-vigente#registro#1703348400000/transitions/rechazar \
  -H "Content-Type: application/json" \
  -d '{
    "motivo_rechazo": "Falta firma del Director de Calidad en página 15",
    "rechazado_por": "maria.gomez@machette.tech"
  }'
```

### Response:
```json
{
  "success": true,
  "token_id": "documento-vigente#registro#1703348400000",
  "estado": "rechazado",
  "event_id": "pqr678...xyz"
}
```

## 9. Ver Métricas

Consultar estadísticas del sistema:

```bash
curl http://localhost:3004/metrics
```

### Response:
```json
{
  "total": 150,
  "vigentes": 80,
  "obsoletos": 45,
  "byEstado": {
    "registro": 5,
    "validacion": 10,
    "aprobado": 10,
    "vigente": 80,
    "rechazado": 0,
    "obsoleto": 45
  },
  "byCategoria": {
    "LEGAL": 30,
    "FISCAL": 25,
    "TECNICO": 40,
    "CALIDAD": 20,
    "OPERATIVO": 35
  }
}
```

## 10. Integración desde Otro ContextVM

Ejemplo de cómo otro ContextVM puede referenciar un documento:

### En CBZ Tesorería Cobros:
```typescript
// Al crear un cobro que requiere una factura
{
  kind: 5054,
  tags: [
    ['context_root', 'cbz-tesoreria-cobros-ejecutados'],
    ['token_id', 'cobro-ejecutado#registro#1703348400000'],
    // Correlación con el documento
    ['correlation', 'cbi-gestordocumental-documentos-vigentes', 'documento-vigente#vigente#1703348400000'],
    ['documento_tipo', 'FACTURA'],
    ['documento_categoria', 'FISCAL']
  ],
  content: JSON.stringify({
    monto: 1000,
    factura_ref: 'documento-vigente#vigente#1703348400000',
    // ... más datos
  })
}
```

### Validar que el tipo de documento existe:
```typescript
// Consultar desde otro servicio
const response = await fetch(
  'http://app:3004/documentos/documento-vigente#vigente#1703348400000'
);
const { success, documento } = await response.json();

if (success && documento.estado === 'vigente') {
  // El tipo de documento es válido y está vigente
  // Proceder con la operación
}
```

---

Este flujo completo demuestra:
- ✅ Creación de documentos con metadatos completos
- ✅ Transiciones a través de todos los estados del FSM
- ✅ Validación y aprobación con actores identificados
- ✅ Activación con fechas de vigencia
- ✅ Gestión de obsolescencia
- ✅ Consultas y filtros
- ✅ Integración con otros bounded contexts
- ✅ Event sourcing completo en Nostr
