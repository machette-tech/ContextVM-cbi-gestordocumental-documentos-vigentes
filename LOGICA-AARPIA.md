# LOGICA AARPIA - ContextVM CBI Gestor Documental Documentos Vigentes

## 1. Token Invariante

El **token invariante** define la identidad única e inmutable de cada documento en el sistema:

```
documento-vigente#registro#[timestamp]
```

### Estructura del Token:
- **Tipo de Entidad**: `documento-vigente` - Identifica que es un documento catalogado
- **Estado Inicial**: `registro` - El estado en el que nace la entidad
- **Identificador Único**: `[timestamp]` - Marca temporal que garantiza unicidad

### Ejemplo:
```
documento-vigente#registro#1703348400000
```

## 2. Tipo de Entidad

Según AARPIA, este ContextVM representa una **Entidad de Contexto (Transductor)**:

- **Entidad Root**: No, aunque gestiona su propio agregado
- **Entidad de Contexto**: **SÍ** - Actúa como transductor para otros ContextVMs
- **Entidad Local**: No, tiene relevancia en múltiples contextos
- **Transductor**: **SÍ** - Proporciona anti-corrupción entre bounded contexts

### Función como Transductor:
Este ContextVM sirve como catálogo maestro de tipos de documentos que:
1. Define la taxonomía de documentos de la organización
2. Proporciona referencias estables para otros bounded contexts
3. Actúa como fuente de verdad para metadatos de documentos
4. Valida y normaliza referencias cruzadas

## 3. Bounded Context

**Bounded Context**: `CBI - Catálogo Básico de Información - Gestor Documental`

### Responsabilidades del Contexto:
- Catalogar tipos de documentos vigentes en la organización
- Gestionar el ciclo de vida de los documentos (desde registro hasta obsolescencia)
- Validar y aprobar nuevos tipos de documentos
- Mantener historial de versiones y cambios
- Proporcionar referencias para documentos en otros contextos

### Límites del Contexto:
- ✅ Define QUÉ documentos existen
- ✅ Gestiona estados y transiciones de documentos
- ✅ Mantiene metadatos y clasificación
- ❌ NO almacena el contenido físico de los documentos
- ❌ NO gestiona permisos de acceso (eso es responsabilidad de otro BC)
- ❌ NO gestiona workflow de aprobaciones (solo estados)

## 4. Event Sourcing

Todos los cambios se registran como eventos inmutables en Nostr:

### Kinds Utilizados:
- **5055**: Request - Solicitudes de operaciones sobre documentos
- **6055**: Result - Resultados de las operaciones

### Eventos del Ciclo de Vida:

```typescript
// Evento: Documento Creado
{
  kind: 5055,
  tags: [
    ['context_root', 'cbi-gestordocumental-documentos-vigentes'],
    ['token_id', 'documento-vigente#registro#1703348400000'],
    ['action', 'created'],
    ['estado', 'registro']
  ],
  content: JSON.stringify({
    nombre: "Manual de Procedimientos",
    categoria: "OPERATIVO",
    formato: "PDF",
    autor: "juan.perez@example.com",
    // ... más datos
  })
}

// Evento: Documento Validado
{
  kind: 5055,
  tags: [
    ['context_root', 'cbi-gestordocumental-documentos-vigentes'],
    ['token_id', 'documento-vigente#registro#1703348400000'],
    ['action', 'transition'],
    ['transition', 'validar'],
    ['estado', 'validacion']
  ],
  content: JSON.stringify({
    validador: "maria.gomez@example.com",
    fecha_validacion: "2024-12-23T10:00:00Z"
  })
}
```

## 5. Finite State Machine (FSM)

La máquina de estados define claramente las transiciones permitidas:

```
┌──────────┐
│ registro │ ────VALIDAR────> ┌────────────┐
└──────────┘                  │ validacion │
                              └────────────┘
                                    │
                        ┌───────────┴───────────┐
                   RECHAZAR                  APROBAR
                        │                       │
                        ▼                       ▼
                 ┌────────────┐          ┌──────────┐
                 │ rechazado  │          │ aprobado │
                 └────────────┘          └──────────┘
                                               │
                                          ACTIVAR
                                               │
                                               ▼
                                         ┌─────────┐
                                         │ vigente │
                                         └─────────┘
                                               │
                                      MARCAR_OBSOLETO
                                               │
                                               ▼
                                         ┌──────────┐
                                         │ obsoleto │
                                         └──────────┘
```

### Guards (Guardias):
- **tieneMetadatosCompletos**: Verifica que el documento tiene todos los metadatos requeridos
- **cumpleRequisitosLegales**: Valida que cumple requisitos legales aplicables
- **tieneVigencia**: Verifica que tiene fechas de vigencia definidas

### Actions (Acciones):
- **asignarEstadoValidacion**: Actualiza estado y registra validador
- **asignarEstadoRechazado**: Registra motivo de rechazo y actor
- **asignarEstadoAprobado**: Registra aprobador y fecha
- **asignarEstadoVigente**: Activa el documento con fechas de vigencia
- **asignarEstadoObsoleto**: Marca como obsoleto con referencia al sustituto

## 6. Correlaciones Entre Contextos

Este ContextVM se correlaciona con otros bounded contexts:

### Ejemplo: Cobros Ejecutados referencia Documentos
```json
{
  "kind": 5054,
  "tags": [
    ["context_root", "cbz-tesoreria-cobros-ejecutados"],
    ["token_id", "cobro-ejecutado#registro#1703348400000"],
    ["correlation", "cbi-gestordocumental-documentos-vigentes", "documento-vigente#registro#1703348400000"],
    ["documento_tipo", "FACTURA"],
    ["documento_ref", "documento-vigente#vigente#1703348400000"]
  ],
  "content": "..."
}
```

### Referencias Cruzadas:
Los otros ContextVMs pueden:
1. Consultar tipos de documentos disponibles
2. Validar que un tipo de documento existe y está vigente
3. Obtener metadatos y requisitos de un tipo de documento
4. Correlacionar sus eventos con tipos de documentos

## 7. Proyecciones (Read Models)

### Proyección: Estado Actual
Tabla `documentos_vigentes` mantiene el estado actual de cada documento:
```sql
SELECT * FROM documentos_vigentes WHERE token_id = ?
```

### Proyección: Historial Completo
Tabla `nostr_events` mantiene todos los eventos:
```sql
SELECT * FROM nostr_events 
WHERE tags @> '[["token_id", "documento-vigente#registro#1703348400000"]]'
ORDER BY created_at
```

### Proyección: Documentos Vigentes
Vista `documentos_actualmente_vigentes`:
```sql
SELECT * FROM documentos_actualmente_vigentes
WHERE categoria = 'LEGAL'
```

## 8. Invariantes del Dominio

### Invariantes que el sistema DEBE mantener:
1. **Inmutabilidad del Token**: Una vez creado, el token_id nunca cambia
2. **Transiciones Válidas**: Solo se permiten transiciones definidas en el FSM
3. **Evento Sourcing**: Todos los cambios se registran como eventos
4. **Unicidad**: No pueden existir dos documentos con el mismo token_id
5. **Vigencia Exclusiva**: Un tipo de documento solo puede tener UNA versión vigente activa

### Reglas de Negocio:
- Un documento rechazado NO puede pasar directamente a vigente
- Un documento debe ser validado Y aprobado antes de activarse
- Un documento vigente solo puede volverse obsoleto (no puede volver atrás)
- La obsolescencia DEBE indicar qué documento lo sustituye

## 9. Anti-Corruption Layer

Este ContextVM actúa como ACL proporcionando:

### Para Contextos Externos:
```typescript
// Interfaz expuesta
interface DocumentoVigentePublicAPI {
  consultarDocumento(tokenId: string): DocumentoVigente
  listarDocumentosVigentes(filtros: FiltrosDocumento): DocumentoVigente[]
  validarDocumentoVigente(tokenId: string): boolean
  obtenerMetadatos(tokenId: string): MetadatosDocumento
}
```

### Traducción de Conceptos:
- Otros BCs usan "tipo de documento" → Este BC usa "documento vigente"
- Otros BCs usan "documento_id" → Este BC usa "token_id"
- Este BC normaliza categorías, formatos y metadatos

## 10. Observabilidad

### Métricas Disponibles:
```typescript
GET /metrics
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
    "OPERATIVO": 55
  }
}
```

### Trazabilidad:
Cada evento en Nostr tiene:
- ID único del evento
- Timestamp exacto
- Firma criptográfica
- Tags para búsqueda eficiente

## 11. Patrones de Integración

### Patrón: Query (Consulta)
```typescript
// Desde otro ContextVM
const response = await fetch('/documentos?categoria=LEGAL&estado=vigente')
const documentos = await response.json()
```

### Patrón: Subscription (Suscripción)
```typescript
// Suscribirse a cambios vía Nostr
relay.subscribe([
  {
    kinds: [6055],
    '#context_root': ['cbi-gestordocumental-documentos-vigentes'],
    '#action': ['transition']
  }
], (event) => {
  // Reaccionar a cambios en documentos
})
```

### Patrón: Correlation (Correlación)
```typescript
// Al crear un evento en otro BC
{
  tags: [
    ['correlation', 'cbi-gestordocumental-documentos-vigentes', tokenId],
    ['documento_tipo', categoria]
  ]
}
```

---

Este diseño sigue fielmente la **Lógica AARPIA**, garantizando:
- ✅ Inmutabilidad mediante Event Sourcing
- ✅ Trazabilidad completa de cambios
- ✅ Separación clara de bounded contexts
- ✅ Anti-corrupción entre contextos
- ✅ Token invariante que identifica entidades
- ✅ FSM que controla transiciones válidas
- ✅ Proyecciones para queries eficientes
