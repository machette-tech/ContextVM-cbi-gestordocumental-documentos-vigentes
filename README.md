# ContextVM - CBI Gestor Documental: Documentos Vigentes

**Contexto Bounded**: Gestión de documentos vigentes y tipos de documentos  
**Dominio**: CBI (Core Business Intelligence)  
**Subdominio**: GestorDocumental  
**Entidad Root**: documento-vigente

## 🎯 Propósito

Catálogo fundamental que define y gestiona los tipos de documentos que se utilizan en todos los procesos de la organización. Actúa como entidad de contexto (transductor) para otros ContextVMs.

## 📋 Características

- **Gestión de Tipos de Documentos**: Define categorías, formatos y requisitos
- **Control de Vigencia**: Estados del ciclo de vida del documento
- **Metadatos Estructurados**: Schema completo para cada tipo de documento
- **Trazabilidad Completa**: Event Sourcing sobre Nostr
- **FSM Visual**: Máquina de estados con XState 5.0
- **Multi-Ambiente**: dev, qa, prod

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────┐
│  FSM Designer (Puerto 4105)                 │
│  https://xstate.cbi.gestordocumental.       │
│  documentosvigentes.controller-ai.com       │
└─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────┐
│  ContextVM App (Puerto 3004)                │
│  - XState 5.0 FSM                           │
│  - PostgreSQL Persistence                   │
│  - Nostr Event Publisher                    │
└─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────┐
│  Nostr Relay (Puerto 8085)                  │
│  - Event Kinds: 5055 (request), 6055 (result)│
│  - Namespace: cbi-gestordocumental-         │
│    documentos-vigentes                      │
└─────────────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────┐
│  PostgreSQL (Puerto 5435)                   │
│  - DB: cbi_gestordocumental_documentos_     │
│    vigentes_dev                             │
│  - Schema: event_sourcing + FSM states      │
└─────────────────────────────────────────────┘
```

## 🔄 Estados de la FSM

```
registro → validación → aprobado → vigente → obsoleto
             ↓
          rechazado
```

### Estados

1. **registro**: Documento recién creado, datos básicos capturados
2. **validacion**: En proceso de validación de metadatos y estructura
3. **rechazado**: No cumple requisitos, requiere corrección
4. **aprobado**: Validado, listo para ser marcado como vigente
5. **vigente**: Documento activo y disponible para uso en procesos
6. **obsoleto**: Documento reemplazado o fuera de uso

### Transiciones

- `validar`: registro → validacion
- `aprobar`: validacion → aprobado
- `rechazar`: validacion → rechazado
- `activar`: aprobado → vigente
- `obsoleter`: vigente → obsoleto
- `reactivar`: obsoleto → vigente

## 📊 Schema del Documento

```typescript
{
  tipo_documento: string;           // Tipo: factura, contrato, nómina, etc.
  codigo: string;                   // Código único identificador
  nombre: string;                   // Nombre descriptivo
  categoria: string;                // Categoría (fiscal, legal, operativo)
  formato: string;                  // PDF, XML, JSON, etc.
  version: string;                  // Control de versiones
  descripcion?: string;             // Descripción detallada
  requisitos_legales?: string[];    // Normativas aplicables
  vigencia_desde?: Date;            // Fecha inicio vigencia
  vigencia_hasta?: Date;            // Fecha fin vigencia (opcional)
  campos_obligatorios?: string[];   // Campos requeridos
  plantilla_url?: string;           // URL a plantilla
  metadata?: Record<string, any>;   // Metadatos adicionales
}
```

## 🚀 Quick Start

### Desarrollo Local

```bash
# Iniciar servicios dev
./dev.sh

# Acceder al FSM Designer
open https://xstate.cbi.gestordocumental.documentosvigentes.controller-ai.com

# Ver logs
docker-compose logs -f cbi-gestordocumental-documentos-vigentes-app

# Health check
curl http://localhost:3004/health
```

### Despliegue Multi-Ambiente

```bash
# Development
./deploy-dev.sh

# QA
./deploy-qa.sh

# Production
./deploy-prod.sh
```

## 📦 Puertos Asignados

- **3004**: App HTTP API
- **4005**: XState Inspector WebSocket
- **4105**: FSM Designer Web UI
- **5435**: PostgreSQL
- **8085**: Nostr Relay
- **8770**: XState Inspector UI

## 🔐 Configuración

### Variables de Entorno

```bash
# Copiar ejemplo
cp .env.example .env

# Editar configuración
vim .env
```

### Secrets

```bash
# Configurar secrets para cada ambiente
./setup-secrets.sh
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
./examples/test-e2e.sh
```

## 📖 Documentación

- [Arquitectura Tags NIP-1](./ARQUITECTURA-TAGS-NIP1.md)
- [Lógica AARPIA](./LOGICA-AARPIA.md)
- [Principios Arquitectura](./PRINCIPIOS-ARQUITECTURA.md)
- [Deployment](./DEPLOYMENT.md)
- [Git Workflow](./GIT-WORKFLOW.md)

## 🔗 Integración con Otros ContextVMs

Este ContextVM actúa como **entidad de contexto** (transductor) para:

- CBZ Tesorería Pagos: Define tipos de documentos de pago
- CBZ Tesorería Cobros: Define tipos de documentos de cobro
- Cualquier proceso que requiera gestión documental

### Ejemplo de Correlación

```json
["correlation", "tipo_documento", "cbi-gestordocumental-documentos-vigentes", "FACTURA-VENTA"]
```

## 📝 Notas de Implementación

### Lógica AARPIA

- **Entidad Root**: `documento-vigente`
- **Token Invariante**: `documento-vigente#registro`
- **Namespace**: `cbi-gestordocumental-documentos-vigentes`
- **Event Kinds**: 5055 (request), 6055 (result)

### DDD Principles

- **Bounded Context**: Gestión documental aislada
- **Aggregate Root**: Documento vigente
- **Value Objects**: TipoDocumento, Categoria, Formato
- **Domain Events**: All state transitions

## 🏷️ Tags Nostr

```json
["L", "cbi-gestordocumental-documentos-vigentes", "root"]
["entity_token", "cbi-gestordocumental-documentos-vigentes", "documento-vigente", "registro"]
["token_tipo", "documento-vigente"]
["proceso_estado_inicial", "registro"]
```

## 👥 Contribución

Ver [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 Licencia

Ver [LICENSE](./LICENSE)

---

**Versión**: 1.0.0  
**Estado**: Development  
**Última Actualización**: 2025-12-23
