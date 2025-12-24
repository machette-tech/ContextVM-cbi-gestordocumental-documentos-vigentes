# 🧪 Testing Strategy

## Herramientas Instaladas

### Testing Unitario y de Integración
- **Vitest**: Framework de testing rápido, compatible con Vite
- **@testing-library/react**: Testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para DOM
- **@testing-library/user-event**: Simulación de eventos de usuario
- **happy-dom**: Implementación ligera del DOM para tests

### Testing E2E y Visual
- **Playwright**: Testing end-to-end multi-navegador
- **Visual Regression**: Capturas de pantalla comparativas

### Mocking
- **MSW (Mock Service Worker)**: Mock de APIs y servicios

## Comandos Disponibles

```bash
# Tests unitarios en modo watch
npm run test

# Tests unitarios con UI interactiva
npm run test:ui

# Tests unitarios una sola vez
npm run test:run

# Tests con cobertura de código
npm run test:coverage

# Tests E2E con Playwright
npm run test:e2e

# Tests E2E con UI interactiva
npm run test:e2e:ui

# Tests E2E en modo debug
npm run test:e2e:debug

# Tests de regresión visual
npm run test:visual

# Ejecutar todos los tests
npm run test:all

# Pipeline completo de CI (lint + tests + build + e2e)
npm run test:ci
```

## Estructura de Tests

```
fsm-designer/
├── src/
│   ├── tests/
│   │   ├── setup.ts              # Configuración global de tests
│   │   └── App.test.tsx           # Tests del componente principal
│   ├── components/
│   │   └── ui/
│   │       └── __tests__/
│   │           ├── button.test.tsx
│   │           └── tabs.test.tsx
│   └── lib/
│       └── __tests__/
│           └── utils.test.ts
├── e2e/
│   ├── app.spec.ts                # Tests E2E funcionales
│   └── visual-regression.spec.ts  # Tests de regresión visual
├── vitest.config.ts               # Configuración de Vitest
└── playwright.config.ts           # Configuración de Playwright
```

## Cobertura de Código

Objetivos mínimos de cobertura:
- **Líneas**: 60%
- **Funciones**: 60%
- **Branches**: 60%
- **Statements**: 60%

Los reportes de cobertura se generan en:
- `coverage/index.html` (visualización web)
- `coverage/lcov.info` (para herramientas CI/CD)

## Tests Implementados

### ✅ Tests Unitarios

1. **App.test.tsx**
   - Renderizado sin errores
   - Logo AARPIA visible
   - Título y descripción correctos
   - Tres tabs presentes
   - Footer con versión
   - Componente NostrStatus

2. **button.test.tsx**
   - Variantes: default, destructive, outline, secondary, ghost, link
   - Tamaños: default, sm, lg, icon
   - Eventos de click
   - Estado disabled
   - Modo asChild

3. **tabs.test.tsx**
   - Renderizado de triggers
   - Contenido por defecto
   - Cambio entre tabs
   - Estado activo/inactivo

4. **utils.test.ts**
   - Función `cn()` para merge de clases
   - Clases condicionales
   - Valores undefined/null
   - Merge de clases Tailwind

### ✅ Tests E2E (app.spec.ts)

1. Carga de la aplicación
2. Logo AARPIA visible
3. Header con título
4. Tres tabs visibles
5. Cambio entre tabs funcional
6. Footer con versión
7. Estilos y colores correctos
8. Responsive en móvil
9. Sin errores JavaScript críticos

### ✅ Tests de Regresión Visual (visual-regression.spec.ts)

1. Snapshot del header
2. Snapshot de cada tab
3. Snapshot de página completa (desktop)
4. Snapshot de página completa (móvil)

## CI/CD Integration

El workflow `.github/workflows/testing.yml` ejecuta:

1. **Lint**: ESLint sobre todo el código
2. **Unit Tests**: Tests unitarios con cobertura
3. **Build**: Compilación de producción
4. **E2E Tests**: Tests en Chromium, Firefox y WebKit
5. **Visual Regression**: Comparación de capturas
6. **Quality Gate**: Verificación de todos los checks

## Prevención de Problemas

Estos tests previenen:

✅ **Regresiones visuales**: Detecta cambios en la UI
✅ **Errores de componentes**: Verifica que shadcn/ui funciona
✅ **Problemas de CSS**: Tests de estilos y colores
✅ **Errores de TypeScript**: Validación de tipos
✅ **Bugs de navegación**: Tests E2E de flujos completos
✅ **Problemas responsive**: Tests en múltiples dispositivos
✅ **Errores JavaScript**: Monitoreo de consola del navegador

## Ejemplo de Uso

### Desarrollo Local

```bash
# Terminal 1: Ejecutar la app
npm run dev

# Terminal 2: Tests en modo watch
npm run test

# Terminal 3: Tests E2E con UI
npm run test:e2e:ui
```

### Antes de Commit

```bash
# Ejecutar toda la pipeline de CI localmente
npm run test:ci
```

### Debugging Tests

```bash
# Ver tests en UI interactiva
npm run test:ui

# Debug de tests E2E paso a paso
npm run test:e2e:debug
```

## Best Practices

1. **Escribir tests ANTES de hacer cambios grandes**
2. **Ejecutar `npm run test:ci` antes de cada commit**
3. **Actualizar snapshots solo después de verificar cambios visuales**
4. **Mantener cobertura >60% en todo momento**
5. **Añadir tests E2E para nuevos flujos de usuario**
6. **Revisar los reportes de Playwright cuando fallen tests**

## Troubleshooting

### Tests E2E fallan localmente

```bash
# Reinstalar navegadores de Playwright
npx playwright install --with-deps
```

### Cobertura baja

```bash
# Ver reporte de cobertura detallado
npm run test:coverage
open coverage/index.html
```

### Visual regression diffs

```bash
# Actualizar snapshots base
npm run test:visual -- --update-snapshots
```

## Próximos Pasos

- [ ] Añadir tests de accesibilidad (axe-core)
- [ ] Integrar Codecov para tracking de cobertura
- [ ] Tests de performance (Lighthouse CI)
- [ ] Tests de carga (k6 o Artillery)
- [ ] Tests de seguridad (OWASP ZAP)
