# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-23

### Added - AARPIA Logic Enhancement
- **Token as Parent Document**: Documented concept of "Documento" as universal parent type
- **DocumentosVigentes as "Registro Civil"**: Mandatory entry point for ALL documents
- **Two Creation Scenarios**: Internal (new) vs External (pre-existing) documents
- **Event = History**: Each Nostr event represents one history of the token in a process
- **Token Invariance**: Token ID remains constant across all histories and domains
- **Tags for Tracking**: Use of Nostr tags to track tokens across multiple events/domains
- **Validated Entity Prerequisite**: Requirement that entity owner must be validated first
- **Milestone Triggers**: Successful state triggers next process's initial state
- **Enhanced Event Sourcing**: Detailed explanation of Event ID vs Token ID distinction

### Changed
- Token format: `documento-vigente#registro#[timestamp]` → `documento#[estado]#[timestamp]`
- Token structure now supports variable initial states (registrado, emitida, construida, etc.)
- Categorization happens during process, not at token creation
- LOGICA-AARPIA.md expanded with comprehensive token lifecycle documentation

### Documentation
- Added section 0: "Concepto Fundamental: El Token como Documento Padre"
- Enhanced section 4: Event Sourcing with practical lifecycle examples
- Enhanced section 6: Cross-context correlations with token tracking via tags
- Enhanced section 8: Domain invariants including token universality rules
- Added section 12: Visual summary of token flow across processes
- Added analogies (Token = DNI, Event = History, DocumentosVigentes = Registro Civil)

## [Unreleased]

### Added
- Initial release of CBI Gestor Documental Documentos Vigentes
- XState 5.0 FSM with 6 states and 6 transitions
- Event Sourcing over Nostr (kinds 5055/6055)
- PostgreSQL persistence with Event Sourcing tables
- REST API with Express
- Docker Compose multi-service setup
- FSM Designer web interface with React
- Complete test suite with Vitest
- Comprehensive documentation
- AARPIA logic implementation
- Health checks and metrics endpoints
- Database views for common queries
- Examples and integration guides

### States
- `registro`: Initial document registration
- `validacion`: Under validation
- `rechazado`: Rejected during validation
- `aprobado`: Approved, pending activation
- `vigente`: Active and valid
- `obsoleto`: Obsolete, replaced by newer version

### Transitions
- `VALIDAR`: registro → validacion
- `RECHAZAR`: validacion → rechazado
- `APROBAR`: validacion → aprobado
- `ACTIVAR`: aprobado → vigente
- `MARCAR_OBSOLETO`: vigente → obsoleto

### Categories
- LEGAL: Legal documents
- FISCAL: Tax-related documents
- TECNICO: Technical documentation
- OPERATIVO: Operational procedures
- CONTRACTUAL: Contracts
- CALIDAD: Quality management
- RRHH: Human resources
- OTRO: Other types

### Formats
- PDF, DOCX, XLSX, TXT, XML, JSON, HTML, OTRO

## [1.0.0] - 2024-12-23

### Added
- Initial release

[Unreleased]: https://github.com/machette-tech/ContextVM-cbi-gestordocumental-documentos-vigentes/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/machette-tech/ContextVM-cbi-gestordocumental-documentos-vigentes/releases/tag/v1.0.0
