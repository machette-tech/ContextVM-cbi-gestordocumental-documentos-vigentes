# Arquitectura de Tags NIP-1 - CBI Gestor Documental Documentos Vigentes

## Sistema de Etiquetas para Documentos Vigentes

### 1. Tags de Contexto Root

#### Definición del Contexto
```json
["L", "cbi-gestordocumental-documentos-vigentes", "root"]
["entity_token", "cbi-gestordocumental-documentos-vigentes", "documento-vigente", "registro"]
["token_tipo", "documento-vigente"]
["proceso_estado_inicial", "registro"]
```

### 2. Tags de Creación (Kind 5055)

```json
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["l", "registro", "cbi-gestordocumental-documentos-vigentes"],
    ["token_tipo", "documento-vigente"],
    
    // Identificadores
    ["token_id", "DOC-2025-001"],
    ["instance_id", "uuid-abc-123"],
    
    // Datos del documento
    ["input", "tipo_documento", "FACTURA-VENTA"],
    ["input", "codigo", "FV-001"],
    ["input", "nombre", "Factura de Venta Estándar"],
    ["input", "categoria", "fiscal"],
    ["input", "formato", "PDF"],
    ["input", "version", "1.0.0"],
    ["input", "descripcion", "Factura de venta para clientes nacionales"],
    
    // Metadatos
    ["source", "fsm-designer"],
    ["timestamp", "1703347200"]
  ]
}
```

### 3. Tags de Transición

#### validar: registro → validacion
```json
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["l", "validacion", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-2025-001"],
    ["token_tipo", "documento-vigente"],
    ["proceso_estado_inicial", "registro"],
    ["proceso_estado_final", "validacion"],
    ["transition", "validar"],
    ["input", "validador_id", "USER-123"],
    ["input", "fecha_validacion", "2025-12-23"]
  ]
}
```

#### aprobar: validacion → aprobado
```json
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["l", "aprobado", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-2025-001"],
    ["proceso_estado_inicial", "validacion"],
    ["proceso_estado_final", "aprobado"],
    ["transition", "aprobar"],
    ["input", "aprobador_id", "ADMIN-456"],
    ["input", "comentarios", "Cumple todos los requisitos"]
  ]
}
```

#### activar: aprobado → vigente
```json
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["l", "vigente", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-2025-001"],
    ["proceso_estado_inicial", "aprobado"],
    ["proceso_estado_final", "vigente"],
    ["transition", "activar"],
    ["input", "vigencia_desde", "2025-12-24"],
    ["input", "activado_por", "ADMIN-456"]
  ]
}
```

### 4. Tags de Resultado (Kind 6055)

```json
{
  "kind": 6055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["request", "<event_id_del_request>"],
    ["status", "success"],
    ["estado_actual", "vigente"],
    
    // Resultado
    ["output", "documento_id", "DOC-2025-001"],
    ["output", "estado", "vigente"],
    ["output", "tipo_documento", "FACTURA-VENTA"],
    ["output", "version", "1.0.0"],
    ["output", "vigencia_desde", "2025-12-24"],
    
    // Metadatos
    ["timestamp", "1703347300"],
    ["processing_time_ms", "45"]
  ]
}
```

### 5. Tags para Uso como Entidad de Contexto

Cuando otros ContextVMs referencian este catálogo:

```json
// En ContextVM de Pagos
["L", "cbi-gestordocumental-documentos-vigentes", "context"]
["entity_source", "cbi-gestordocumental-documentos-vigentes", "relay_url", "ws://localhost:8085"]
["correlation", "tipo_documento", "cbi-gestordocumental-documentos-vigentes", "FACTURA-VENTA"]
```

### 6. Tags de Query

```json
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["operation", "query"],
    ["query_type", "list_vigentes"],
    ["filter_categoria", "fiscal"],
    ["filter_formato", "PDF"]
  ]
}
```

### 7. Principios de Etiquetado

1. **Namespace único**: `cbi-gestordocumental-documentos-vigentes`
2. **Token invariante**: `documento-vigente#registro`
3. **Estados explícitos**: Cada transición marca estado inicial y final
4. **Trazabilidad**: Cada evento referencia su request
5. **Metadatos ricos**: Incluir contexto para auditoría

### 8. Correlaciones Multi-Contexto

```json
// Documento referenciado desde Pagos
["correlation:source", "cbi-gestordocumental-documentos-vigentes", "DOC-2025-001"]
["correlation:type", "tipo_documento", "ORDEN-PAGO"]

// Documento referenciado desde Cobros
["correlation:source", "cbi-gestordocumental-documentos-vigentes", "DOC-2025-002"]
["correlation:type", "tipo_documento", "RECIBO-COBRO"]
```

### 9. Tags de Metadatos Especiales

```json
// Control de versiones
["documento_version", "1.0.0"]
["version_anterior", "0.9.0"]
["breaking_change", "false"]

// Normativas
["requisito_legal", "RD 1619/2012"]
["requisito_legal", "Ley 58/2003"]

// Auditoría
["creado_por", "ADMIN-123"]
["modificado_por", "ADMIN-456"]
["fecha_creacion", "2025-12-23T10:00:00Z"]
["fecha_modificacion", "2025-12-23T15:30:00Z"]
```

### 10. Ejemplo Completo de Flujo

```json
// 1. Creación
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["l", "registro", "cbi-gestordocumental-documentos-vigentes"],
    ["token_tipo", "documento-vigente"],
    ["token_id", "DOC-CONTRATO-001"],
    ["input", "tipo_documento", "CONTRATO-LABORAL"],
    ["input", "codigo", "CTL-001"],
    ["input", "nombre", "Contrato Indefinido Estándar"]
  ]
}

// 2. Validación
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-CONTRATO-001"],
    ["proceso_estado_inicial", "registro"],
    ["proceso_estado_final", "validacion"],
    ["transition", "validar"]
  ]
}

// 3. Aprobación
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-CONTRATO-001"],
    ["proceso_estado_inicial", "validacion"],
    ["proceso_estado_final", "aprobado"],
    ["transition", "aprobar"]
  ]
}

// 4. Activación
{
  "kind": 5055,
  "tags": [
    ["L", "cbi-gestordocumental-documentos-vigentes"],
    ["token_id", "DOC-CONTRATO-001"],
    ["proceso_estado_inicial", "aprobado"],
    ["proceso_estado_final", "vigente"],
    ["transition", "activar"],
    ["input", "vigencia_desde", "2025-12-24"]
  ]
}
```

---

Esta arquitectura sigue los principios de **Lógica AARPIA** para máxima trazabilidad y consultas eficientes.
