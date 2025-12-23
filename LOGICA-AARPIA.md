# LOGICA AARPIA - ContextVM CBI Gestor Documental Documentos Vigentes

**Versión**: 1.1.0  
**Fecha**: 2024-12-23

## 0. Concepto Fundamental: El Token como Documento Padre

### ⚠️ IMPORTANTE: DocumentosVigentes como "Registro Civil"

**Todos los documentos en el sistema, sin excepción, DEBEN pasar por este proceso para obtener su Token ID oficial.**

Este ContextVM es el **punto de entrada obligatorio** para cualquier documento, funcionando como un "Registro Civil" que:
- ✅ Asigna el Token ID único e inmutable
- ✅ Categoriza el tipo de documento hijo
- ✅ Registra la primera historia del token en Nostr
- ✅ Valida que pertenece a una Entidad Validada
- ✅ Crea el evento fundacional con tags correctos

### El Token como Tipo de Documento Padre

El **Token** es el tipo de documento base sin categorizar:
- **Nombre**: "Documento" (tipo padre)
- **Estado Inicial**: "Registrado"
- **Único**: No puede haber otro tipo de documento padre
- **Categorización**: Ocurre durante el proceso

Durante el proceso en DocumentosVigentes, el Token se categoriza en tipos específicos:
- DocumentoVigente (LEGAL, FISCAL, TECNICO, etc.)
- FacturaVenta
- CobroEjecutado
- PagoEjecutado
- ObjetoDeValor
- EntidadValidada
- etc.

### Dos Escenarios de Creación de Token

#### 1. Documento NUEVO (nace dentro del sistema)
```
Trigger: Archivo llega O Usuario clicka "Crear"

CBI.GestorDocumental.DocumentosVigentes
├─ Token Padre: "Documento"
├─ Estado Inicial: "Registrado"
├─ Se asigna Token ID: documento#registrado#1703340000
├─ FSM: Registrado → Validación → Aprobado → Vigente
├─ Categorización: DocumentoVigente tipo "TECNICO"
└─ Hito exitoso: "Vigente" → Token listo para otros procesos
```

#### 2. Documento EXTERNO (nace fuera del sistema)
```
Trigger: Factura YA EMITIDA desde sistema externo

DEBE pasar por: CBI.GestorDocumental.DocumentosVigentes
├─ Token Padre: "Documento"
├─ Estado que traía: "Emitida" (del sistema externo)
├─ Se asigna Token ID: documento#emitida#1703340000
├─ Categorización: "FacturaVenta"
├─ Evento Nostr: Kind 5055 con tags de categorización
└─ Puede continuar a: CBZ.Ventas.FacturasVenta
    ├─ Estado inicial: "Emitida"
    └─ Hito: "Etiquetada"
```

### Regla de Oro

**Sin pasar por DocumentosVigentes = Sin Token ID = No existe en el sistema**

Todo documento requiere:
1. **Tipo de documento padre**: "Documento"
2. **Estado inicial**: El que corresponda (Registrado, Emitida, etc.)
3. **Entidad dueña**: Persona o Empresa validada
4. **Token ID**: Asignado SOLO por este proceso

## 1. Token Invariante

El **token invariante** define la identidad única e inmutable de cada documento en el sistema:

```
documento#[estado_inicial]#[timestamp]
```

### Estructura del Token:
- **Tipo de Documento Padre**: `documento` - Tipo padre sin categorizar
- **Estado Inicial**: Variable según origen - El estado en el que nace el token
- **Identificador Único**: `[timestamp]` - Marca temporal que garantiza unicidad

### Ejemplos:
```
documento#registrado#1703348400000   (documento nuevo interno)
documento#emitida#1703348500000      (factura externa ya emitida)
documento#construida#1703348600000   (puerta externa ya construida)
```

### Token vs Categorización

El Token es invariante y único, pero el documento se categoriza durante el proceso:

```
Token ID: documento#registrado#1703348400000
  └─ Categoría: DocumentoVigente tipo LEGAL
  └─ Otros procesos lo referencian por este Token ID

Token ID: documento#emitida#1703348500000
  └─ Categoría: FacturaVenta
  └─ Continúa en CBZ.Ventas.FacturasVenta
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

Todos los cambios se registran como eventos inmutables en Nostr.

### Concepto Clave: Evento = Historia del Token

Cada evento Nostr representa **una historia** del token en un proceso específico:
- **ID del Evento**: Identifica esa historia única (fila en tabla de datos)
- **Token ID**: Identificador invariante que cruza todas las historias (en tags)
- **Mismo Token + Mismo Proceso + Diferentes Circunstancias** = NUEVO evento

### Ejemplo Práctico: Ciclo de Vida de una Puerta

```
Token: documento#construida#1703340000

Historia 1 (Evento ID: abc123):
  Kind: 5055
  Proceso: CBI.Construccion.Fabricacion
  Estado: construida
  Tags: ['token_id', 'documento#construida#1703340000']
  
Historia 2 (Evento ID: def456):
  Kind: 5055
  Proceso: CBZ.Logistica.Transporte
  Estado: en_transito
  Tags: ['token_id', 'documento#construida#1703340000']
  
Historia 3 (Evento ID: ghi789):
  Kind: 5055
  Proceso: CBI.Mantenimiento.Instalacion
  Estado: instalada
  Tags: ['token_id', 'documento#construida#1703340000']
  
Historia 4 (Evento ID: jkl012):
  Kind: 5055
  Proceso: CBI.Operaciones.Uso
  Estado: abierta
  Tags: ['token_id', 'documento#construida#1703340000']
  
Historia 5 (Evento ID: mno345):
  Kind: 5055
  Proceso: CBI.Operaciones.Uso    ← MISMO PROCESO
  Estado: cerrada                  ← DIFERENTES CIRCUNSTANCIAS
  Tags: ['token_id', 'documento#construida#1703340000']
```

### Kinds Utilizados:
- **5055**: Request - Solicitudes de operaciones sobre documentos
- **6055**: Result - Resultados de las operaciones

### Eventos del Ciclo de Vida:

```typescript
// Evento: Documento Nuevo Creado (Interno)
{
  kind: 5055,
  id: "abc123...",  // ID de esta historia
  tags: [
    ['context_root', 'cbi-gestordocumental-documentos-vigentes'],
    ['token_id', 'documento#registrado#1703348400000'],  // ← Token invariante
    ['action', 'created'],
    ['estado', 'registrado'],
    ['entidad', 'uuid-entidad-validada'],
    ['tipo_documento', 'Documento']  // ← Tipo padre
  ],
  content: JSON.stringify({
    nombre: "Manual de Procedimientos",
    categoria: "OPERATIVO",  // ← Se categorizará en el proceso
    formato: "PDF",
    autor: "juan.perez@example.com"
  })
}

// Evento: Documento Externo Categorizado
{
  kind: 5055,
  id: "xyz789...",  // ID de esta historia
  tags: [
    ['context_root', 'cbi-gestordocumental-documentos-vigentes'],
    ['token_id', 'documento#emitida#1703348500000'],  // ← Token con estado externo
    ['action', 'categorized'],
    ['estado', 'emitida'],  // ← Estado que traía de fuera
    ['entidad', 'uuid-entidad-validada'],
    ['tipo_documento', 'Documento'],  // ← Tipo padre
    ['tipo_documento_hijo', 'FacturaVenta'],  // ← Categorización
    ['origen', 'externo']
  ],
  content: JSON.stringify({
    numero_factura: "FV-2024-001",
    sistema_origen: "ERP Legacy"
  })
}

// Evento: Transición de Estado
{
  kind: 5055,
  id: "def456...",  // Nueva historia
  tags: [
    ['context_root', 'cbi-gestordocumental-documentos-vigentes'],
    ['token_id', 'documento#registrado#1703348400000'],  // ← MISMO token
    ['action', 'transition'],
    ['transition', 'validar'],
    ['estado_anterior', 'registrado'],
    ['estado_nuevo', 'validacion']
  ],
  content: JSON.stringify({
    validador: "maria.gomez@example.com",
    fecha_validacion: "2024-12-23T10:00:00Z"
  })
}
```

### Hitos y Disparo de Procesos

Un **hito exitoso** en un proceso dispara el **estado inicial** del siguiente:

```
Proceso 1: CBI.Construccion.Fabricacion
  Estado final exitoso: "construida" (HITO)
  ↓ DISPARA
Proceso 2: CBZ.Logistica.Transporte  
  Estado inicial: "en_transito"
  Estado final exitoso: "entregada" (HITO)
  ↓ DISPARA
Proceso 3: CBI.Operaciones.Uso
  Estado inicial: "instalada"
```

Estados finales sin éxito (destruida, eliminada, rechazada) terminan el ciclo de vida del token.

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

Este ContextVM se correlaciona con otros bounded contexts mediante el Token ID invariante.

### Ejemplo: Cobros Ejecutados referencia Token de Factura
```json
{
  "kind": 5054,
  "id": "evento-cobro-123",
  "tags": [
    ["context_root", "cbz-tesoreria-cobros-ejecutados"],
    ["token_id", "cobro-ejecutado#registro#1703348400000"],
    ["correlation", "cbi-gestordocumental-documentos-vigentes", "documento#emitida#1703348500000"],
    ["documento_tipo_hijo", "FacturaVenta"],
    ["entidad", "uuid-entidad-validada"]
  ],
  "content": "..."
}
```

### El Token cruza dominios mediante Tags

La clave para rastrear un token a través de múltiples procesos y dominios son las **etiquetas (tags)**:

```
Token: documento#registrado#1703340000

Dominio: CBI.GestorDocumental.DocumentosVigentes
  Event ID: abc123
  Tags: ['token_id', 'documento#registrado#1703340000']
  
Dominio: CBZ.Ventas.FacturasVenta  
  Event ID: def456
  Tags: ['token_id', 'documento#registrado#1703340000']
  
Dominio: CBZ.Tesoreria.CobrosEjecutados
  Event ID: ghi789
  Tags: ['token_id', 'documento#registrado#1703340000']
```

El **Token Invariante** es el mismo, los **Event IDs** son diferentes (cada uno es una historia).

### Prerequisito: Entidad Validada

**IMPORTANTE**: Para iniciar cualquier proceso, la Entidad propietaria del Token DEBE estar validada:

```
CBI.Catalogos.EntidadesValidadas (Proceso prerequisito)
  ↓
  Entidad UUID: uuid-entidad-validada
  Estado: Validada
  ↓
CBI.GestorDocumental.DocumentosVigentes (Este proceso)
  ↓
  Token: documento#registrado#[timestamp]
  Entidad: uuid-entidad-validada (ya validada)
```

**Sin Entidad Validada = No se puede iniciar el proceso**

La Entidad ha "adquirido" el proceso para poder procesar sus tokens.

### Referencias Cruzadas:
Los otros ContextVMs pueden:
1. Consultar si un token existe y está en estado válido
2. Validar que la categorización del token es correcta
3. Obtener metadatos del token mediante su Token ID
4. Correlacionar sus eventos con el Token ID en tags
5. Rastrear la historia completa del token a través de dominios

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
2. **Token Único**: Cada token_id es único en todo el sistema (timestamp garantiza unicidad)
3. **Transiciones Válidas**: Solo se permiten transiciones definidas en el FSM
4. **Event Sourcing**: Todos los cambios se registran como eventos en Nostr
5. **Historia Inmutable**: Los eventos (historias) nunca se modifican ni eliminan
6. **Entidad Validada**: Todo token DEBE tener una entidad propietaria validada
7. **Categorización Obligatoria**: Todo token DEBE ser categorizado en un tipo hijo
8. **Token = Historia**: Mismo token puede tener múltiples historias (eventos)

### Reglas de Negocio:
- Un documento rechazado NO puede pasar directamente a vigente
- Un documento debe ser validado Y aprobado antes de activarse
- Un documento vigente solo puede volverse obsoleto (no puede volver atrás)
- La obsolescencia DEBE indicar qué documento lo sustituye
- **Proceso DocumentosVigentes es OBLIGATORIO** para todos los documentos
- **Sin Token ID = Sin existencia** en el sistema
- Mismo token + mismo proceso + diferentes circunstancias = nueva historia (nuevo evento)
- Hito exitoso de un proceso → Dispara estado inicial del siguiente proceso
- Estado final sin éxito (destruida, eliminada) → Termina ciclo de vida del token

### Token como Identificador Universal

El Token NO es el ID del evento Nostr:
- **ID del Evento Nostr**: Identifica UNA historia específica del token
- **Token ID**: Identifica al documento a través de TODAS sus historias
- **Tags**: Permiten rastrear el token a través de múltiples eventos/dominios

```
Token: documento#construida#1703340000  ← Invariante
  ├─ Historia 1: Event ID abc123 (Fabricacion)
  ├─ Historia 2: Event ID def456 (Transporte)
  ├─ Historia 3: Event ID ghi789 (Instalacion)
  └─ Historia 4: Event ID jkl012 (Uso)
```

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
- ✅ Proyecciones para queries eficientes- ✅ **Token como documento padre universal**
- ✅ **DocumentosVigentes como punto de entrada obligatorio**
- ✅ **Evento = Historia del token en un proceso**
- ✅ **Tags para rastrear tokens entre dominios**
- ✅ **Prerequisito de Entidad Validada**
- ✅ **Hitos que disparan procesos subsecuentes**

## 12. Resumen Visual: Flujo del Token

```
┌─────────────────────────────────────────────────────────────────┐
│  PREREQUISITO: CBI.Catalogos.EntidadesValidadas                │
│  Entidad UUID: uuid-entidad-validada                            │
│  Estado: Validada                                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  OBLIGATORIO: CBI.GestorDocumental.DocumentosVigentes          │
│  "Registro Civil" de todos los documentos                      │
│                                                                  │
│  Token Padre: "Documento"                                       │
│  Estado Inicial: Registrado (nuevo) | Emitida (externo)        │
│  Token ID asignado: documento#[estado]#[timestamp]             │
│  Categorización: DocumentoVigente | FacturaVenta | etc.        │
│  Evento Nostr: Kind 5055 con tags                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  Token: documento#registrado#1703340000                        │
│                                                                  │
│  Historia 1 (Event abc123): CBI.GestorDocumental              │
│    Estado: Vigente (HITO) → Dispara siguiente proceso         │
│                                                                  │
│  Historia 2 (Event def456): CBZ.Ventas.FacturasVenta         │
│    Estado: Emitida (HITO) → Dispara siguiente proceso         │
│                                                                  │
│  Historia 3 (Event ghi789): CBZ.Tesoreria.CobrosEjecutados   │
│    Estado: Cobrada (HITO) → Dispara siguiente proceso         │
│                                                                  │
│  Mismo Token, diferentes historias, múltiples dominios         │
│  Rastreable por Tags en eventos Nostr                          │
└─────────────────────────────────────────────────────────────────┘
```

**Concepto Clave**: El Token es como una persona con DNI que tiene múltiples historias (trabajos, viajes, estudios) registradas en diferentes sistemas, pero siempre identificada por el mismo DNI.