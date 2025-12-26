# Contributing to ContextVM CBI Gestor Documental Documentos Vigentes

¡Gracias por tu interés en contribuir! 🎉

## Código de Conducta

Este proyecto sigue un código de conducta. Al participar, te comprometes a mantener un ambiente respetuoso y colaborativo.

## Cómo Contribuir

### Reportar Bugs

1. Verifica que el bug no haya sido reportado anteriormente
2. Abre un issue con:
   - Descripción clara del problema
   - Pasos para reproducirlo
   - Comportamiento esperado vs actual
   - Logs relevantes
   - Información del entorno

### Proponer Nuevas Features

1. Abre un issue describiendo:
   - La feature propuesta
   - Caso de uso
   - Beneficios
   - Posible implementación

### Pull Requests

1. **Fork** el repositorio
2. **Crea una rama** para tu feature:
   ```bash
   git checkout -b feature/mi-nueva-feature
   ```
3. **Realiza tus cambios** siguiendo las guías de estilo
4. **Escribe tests** para tu código
5. **Asegúrate** que todos los tests pasen:
   ```bash
   npm test
   ```
6. **Commit** tus cambios con mensajes descriptivos:
   ```bash
   git commit -m "feat: añadir validación de metadatos"
   ```
7. **Push** a tu fork:
   ```bash
   git push origin feature/mi-nueva-feature
   ```
8. **Abre un Pull Request** en GitHub

## Guías de Desarrollo

### Estructura del Código

```
cbi-gestordocumental-documentos-vigentes/
├── src/
│   ├── index.ts              # Entry point
│   ├── machines/             # XState machines
│   ├── services/             # Business logic
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
├── tests/                    # Test files
└── database/                 # SQL schemas
```

### Estilo de Código

- **TypeScript**: Usa tipos estrictos
- **Naming**:
  - Archivos: `kebab-case.ts`
  - Clases: `PascalCase`
  - Funciones: `camelCase`
  - Constantes: `UPPER_SNAKE_CASE`
- **Formato**: Usa el formatter del proyecto
  ```bash
  npm run format
  ```

### Tests

- Escribe tests para toda nueva funcionalidad
- Mantén cobertura > 80%
- Tests unitarios en `tests/`
- Usa Vitest para testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check coverage
npm run test:coverage
```

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nueva feature
- `fix:` Bug fix
- `docs:` Cambios en documentación
- `style:` Formato, sin cambios de código
- `refactor:` Refactorización
- `test:` Añadir/modificar tests
- `chore:` Mantenimiento

Ejemplo:
```
feat(fsm): añadir transición de revalidación

- Permite revalidar documentos rechazados
- Añade guard para verificar cambios
- Actualiza tests
```

### Documentación

- Documenta funciones públicas con JSDoc
- Actualiza README.md si cambias funcionalidad
- Añade ejemplos para nuevas features
- Documenta cambios en CHANGELOG.md

### AARPIA Logic

Al contribuir, respeta los principios de AARPIA:

1. **Token Invariante**: No cambies la estructura del token
2. **Event Sourcing**: Todos los cambios deben ser eventos
3. **FSM**: Las transiciones deben estar definidas en la máquina de estados
4. **Bounded Context**: Respeta los límites del contexto
5. **Inmutabilidad**: Los eventos son inmutables

## Proceso de Review

1. Un maintainer revisará tu PR
2. Puede solicitar cambios
3. Una vez aprobado, se hará merge
4. Tu contribución aparecerá en el próximo release

## Configuración del Entorno de Desarrollo

```bash
# Clone el repositorio
git clone https://github.com/machette-tech/ContextVM-cbi-gestordocumental-documentos-vigentes.git
cd ContextVM-cbi-gestordocumental-documentos-vigentes

# Instalar dependencias
cd cbi-gestordocumental-documentos-vigentes
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Iniciar servicios
cd ..
./dev.sh

# En otra terminal, ejecutar tests
cd cbi-gestordocumental-documentos-vigentes
npm test
```

## Recursos

- [Documentación ContextVM](https://contextvm.org)
- [XState Documentation](https://xstate.js.org)
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)

## Preguntas

Si tienes preguntas, puedes:
- Abrir un issue con la etiqueta `question`
- Contactar a los maintainers
- Unirte a nuestro canal de Discord

¡Gracias por contribuir! 🚀
