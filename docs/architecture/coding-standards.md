# learning-node-netjs-typeorm - Estándares de Código

## Información General

### Propósito del Documento

Este documento define los estándares de código obligatorios y recomendados para el desarrollo en learning-node-netjs-typeorm (REST API "Sistema de Gestión de Tareas": NestJS + TypeScript + TypeORM + PostgreSQL). Garantizan consistencia, legibilidad y mantenibilidad del código.

- **Audiencia**: Desarrolladores, Code Reviewers
- **Última Actualización**: 2026-09-29
- **Estado**: Activo

> **Nota de greenfield**: el workspace no tiene código todavía. Los ejemplos son **proyecciones** construidas sobre la evidencia del proyecto (`guia.md` y el GPS en `docs/architecture/index.md`); se recalibrarán contra el código real al cerrar la primera historia (`dev-rapido` sobre `docs/stories/1-gestion-tareas-api/`).

---

## Estándares Obligatorios

### 1. Nomenclatura

#### Variables y Funciones

```typescript
// ✅ CORRECTO — camelCase para variables, funciones y métodos (guia.md §5-7: servicios con lógica de negocio)
const tareas = await this.tareasHandler.listar();
export async function obtenerPorId(id: number): Promise<Tarea> { ... }

// ❌ INCORRECTO
const Tareas = await this.listarTareas();      // mayúsculas en variables
export async function ObtenerPorId(id: number) { ... }  // PascalCase en funciones
```

#### Clases y Componentes

```typescript
// ✅ CORRECTO — PascalCase para clases; sufijo Dto para DTOs (guia.md §6: CreateUserDto)
@Injectable()
export class CrearTareaHandler { ... }

export class CreateTareaDto { ... }

// ❌ INCORRECTO
export class crearTareaHandler { ... }   // lowercase en clase
export class CreateTareaDTO { ... }      // sufijo inconsistente con la convención del proyecto (Dto)
```

#### Archivos y Directorios

```
// ✅ CORRECTO — kebab-case en archivos, sufijos NestJS estándar (guia.md §2, §5)
src/modules/tareas/tareas.module.ts
src/modules/tareas/tareas.controller.ts
src/modules/tareas/tareas.service.ts
src/modules/tareas/dto/create-tarea.dto.ts
src/modules/tareas/dto/update-tarea.dto.ts

// ❌ INCORRECTO
TareasController.ts          // PascalCase en archivo
createTareaDto.ts            // camelCase en archivo
```

### 2. Estructura de Código

#### Organización de Imports

```typescript
// ✅ CORRECTO - Orden de imports
// 0. reflect-metadata: SIEMPRE primero en el punto de entrada (guia.md §3)
// 1. Librerías externas (typeorm, class-validator, @nestjs/*)
// 2. Dominio y aplicación (entidades, handlers, DTOs)
// 3. Infraestructura local (repositorios TypeORM, config)
import "reflect-metadata";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tarea } from "./domain/tarea";
import { TareaRepository } from "./infrastructure/tarea.repository";

// ❌ INCORRECTO
import { TareaRepository } from "./infrastructure/tarea.repository"; // infra antes que dominio
import "reflect-metadata";  // en el medio del archivo, no en el punto de entrada
```

#### Estructura de Funciones

```typescript
// ✅ CORRECTO — controlador delgado: delega en la capa de aplicación (GPS: borde API → CQRS → dominio)
async crear(@Body() createTareaDto: CreateTareaDto): Promise<Tarea> {
  return this.crearTareaHandler.ejecutar(createTareaDto);
}

// ❌ INCORRECTO — lógica de negocio y acceso a datos en el controlador
async crear(@Body() body: any) {
  const repo = AppDataSource.getRepository(Tarea);   // acceso directo a datos (guia.md §7, prohibido en el controlador)
  return repo.save({ ...body, estado: "pendiente" }); // invariante del dominio duplicada en el borde
}
```

### 3. Manejo de Errores

```typescript
// ✅ CORRECTO — excepciones HTTP semánticas de NestJS (alineado con ACs HU #1: 404/401/400-422)
throw new NotFoundException(`Tarea ${id} no encontrada`);
// ValidationPipe global con whitelist: true → 400 automático para DTOs inválidos (guia.md §6)

// ❌ INCORRECTO — errores genéricos o swallows
try {
  return await repo.findOneBy({ id });
} catch {
  return null; // traga el error; el controlador no puede distinguir "no existe" de un fallo real
}
// res.status(500).send("algo salió mal")  // respuesta manual fuera del contrato HTTP de NestJS
```

### 4. Restricciones Arquitectónicas de Codificación

#### Respeto de Capas y Responsabilidades

```typescript
// ✅ CORRECTO - Respetar boundaries entre capas (GPS: Borde → CQRS → Dominio → Infraestructura)
// Dominio: sin imports de NestJS ni TypeORM; invariantes en la entidad
export class Tarea {
  constructor(public readonly titulo: string, public readonly estado: EstadoTarea = "pendiente") {
    if (!titulo || titulo.trim().length === 0) throw new Error("El título es obligatorio");
  }
}
// Aplicación: handler de comando orquesta dominio + puerto de persistencia
// Infraestructura: TypeORM implementa el puerto TareaRepository
```

```typescript
// ❌ INCORRECTO - Violación de capas
// 1) Controlador que importa y usa repositorio TypeORM directamente (salta CQRS + dominio)
// 2) Entidad de dominio que importa @nestjs/common o "typeorm" (copia el framework)
// 3) Comando que muta el estado y además lo lee para responder (mezcla CQRS)
```

#### Restricciones adicionales

- **Credenciales fuera del código**: `host/port/username/password/database` de PostgreSQL solo vía variables de entorno — la guía actual las hardcodea y es un gap explícito a corregir (GPS §Seguridad).
- **Validación estricta**: `ValidationPipe` global con `whitelist: true` (descarta propiedades no declaradas en el DTO) — obligatorio en `main.ts`.
- **Autenticación en el borde**: guard JWT en todas las rutas `/tareas`; ninguna ruta expuesta sin guard.
- **CQRS**: escribir (crear/actualizar/eliminar) solo a través de handlers de comando; leer (listar/obtener) solo a través de handlers de query.

### 5. Programación Asíncrona (async/await y Promesas)

- **`async/await` como patrón único**: toda operación asíncrona (HTTP, TypeORM, E/S) se escribe con `async/await`. Prohibido mezclar `.then()/.catch()` en el mismo código, y prohibido `callback` para operaciones que el stack ya resuelve con Promesas.
- **Toda Promesa se consume**: `await` siempre, o `void` explícito cuando la intención es no esperar (fire-and-forget). Prohibido invocar una función `async` sin consumir su Promesa (Promise rejected no manejada).
- **Nunca bloquear el event loop**: prohibido `synchronous` I/O de Node (`fs.readFileSync`, `fs.mkdirSync`) en la ruta de una petición; solo `fs/promises`.
- **Errores de Promesas siempre manejados**: `try/catch` en el handler (capa de aplicación) o propagación explícita hasta un filtro global; nunca `.catch(() => {})` vacío ni `try/catch` que traga el error.
- **Sin `setImmediate`/`setTimeout` como control de flujo**: solo para retardos reales (p. ej. reintentos con backoff), nunca para "esperar" una Promesa.

```typescript
// ✅ CORRECTO — async/await end-to-end, await consumido, error propagado a un filtro global
@Injectable()
export class ObtenerTareaHandler {
  constructor(private readonly repository: TareaRepository) {}

  async ejecutar(id: number): Promise<Tarea> {
    const tarea = await this.repository.findOneBy({ id });
    if (!tarea) throw new NotFoundException(`Tarea ${id} no encontrada`);
    return tarea;
  }
}

// ❌ INCORRECTO
// 1) Cadena .then() mezclada con async/await (inconsistente con el resto del código)
//    this.repository.findOneBy({ id }).then(t => t ?? null).catch(() => null);
// 2) Invocar async sin await (Promesa huérfana; el 404 nunca se lanza a tiempo)
//    this.repository.save(tarea);
//    return { ok: true };
// 3) I/O síncrono en la ruta de la petición: fs.readFileSync(configPath)
// 4) try/catch que traga el error: catch (e) { return []; }
```

### 6. UI / Design System

N/A — el proyecto no tiene insumos de diseño (Tokens.json/Hoja_Variantes.md) generados todavía. La historia #1 es API REST únicamente, sin interfaz de usuario.

### 7. Pruebas Unitarias

#### Convención de Testing: no detectada (greenfield) — se adopta Jest (default del CLI NestJS, guia.md §9) + Arrange-Act-Assert (3A)

```typescript
// ✅ CORRECTO — TestingModule de NestJS + 3A + naming descriptivo (proyección, sin ejemplo real disponible)
describe("ObtenerTareaHandler", () => {
  it("debe retornar la tarea al obtener un ID que existe", async () => {
    // Arrange
    const repository = { findOneBy: jest.fn().mockResolvedValue(tareaFixture) };
    // Act
    const resultado = await handler.ejecutar(1);
    // Assert
    expect(resultado.id).toBe(1);
  });

  it("debe lanzar NotFoundException al obtener un ID inexistente", async () => {
    // Arrange
    const repository = { findOneBy: jest.fn().mockResolvedValue(null) };
    // Act / Assert
    await expect(handler.ejecutar(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});

// ❌ INCORRECTO
// - it("works") / it("test") — naming sin descripción del comportamiento
// - Probar contra la base de datos real en tests unitarios (eso es e2e)
// - Asertar sobre el mock en lugar del resultado público del handler
```

---

## Convenciones Recomendadas

### 1. Organización de Archivos

```
// Estructura objetivo (GPS hexagonal) aplicada al layout de módulos de NestJS
src/
  main.ts                      # reflect-metadata + ValidationPipe + Swagger + CORS (guia.md §6, §8)
  app.module.ts                # registra módulos de dominio en imports
  shared/
    guards/                    # jwt-auth.guard.ts
    filters/                   # manejo global de errores
  modules/
    tareas/
      api/                     # borde: tareas.controller.ts + dto/
      application/             # CQRS: commands/ y queries/ (handlers)
      domain/                  # entidad Tarea + puertos (interfaces) — SIN imports de framework
      infrastructure/          # TypeORM: entity + repository que implementan los puertos
    auth/                      # pendiente (HU futura: registro/login)
  database/
    data-source.ts             # DataSource de TypeORM con variables de entorno (guia.md §3)
```

### 2. Patrones de Código

```typescript
// DTOs con class-validator (guia.md §6) + Swagger en el borde (guia.md §8)
export class CreateTareaDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: "Estudar NestJS" })
  titulo: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  descripcion?: string;
}

// Params de ruta tipados: @Param("id", ParseIntPipe) — nunca string sin conversión (guia.md §8)
```

### 3. Convenciones Complementarias para Tests

```typescript
// Naming: describe() = unidad bajo test (Handler/Controller/Service), it() = comportamiento + condición
// Dobles: mocks de puertos del dominio (jest.fn()) para tests unitarios; nunca mocks a mitad de capa
// E2E (posterior): supertest contra el app NestJS para verificar estados HTTP reales (201/200/204/401/404)
// Fixtures de datos (Tarea) reutilizables por test en lugar de datos inline duplicados
```

---

## Configuración de Herramientas

### Linter

```json
{
  "_nota": "configuración proyectada — el CLI NestJS genera .eslintrc al inicializar (guia.md §2); se valida contra el archivo real en la primera implementación",
  "extends": "eslint:recommended",
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    "prettier/prettier": "error"
  }
}
```

### Formatter

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### Scripts

```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.ts\"",
    "lint:fix": "eslint \"src/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "test:unit": "jest"
  }
}
```

---

## Recomendaciones de Evolución

- **`@nestjs/config`**: carga centralizada de variables de entorno; reemplaza el acceso manual a `process.env` (gap del GPS: credenciales hardcoded en `guia.md`).
- **Migraciones TypeORM** en lugar de `synchronize: true` para cualquier entorno distinto de desarrollo (decisión pendiente en el GPS).
- **Test Data Builders** (p. ej. `fakers` o factory fns) para fixtures de `Tarea`, si la cantidad de tests lo justifica.
- **`testcontainers`** para e2e contra PostgreSQL real, cuando existan tests e2e.
- **SonarQube** como capa de calidad continua, una vez que exista código y `package.json` reales para calibrar los umbrales.

---

## Referencias y Recursos

- `docs/architecture/index.md` — GPS arquitectónico (capas hexagonales, CQRS, DDD, decisiones pendientes)
- `guia.md` — guía del stack: comandos CLI NestJS, TypeORM, DTOs, pipes/guards, Swagger
- `docs/stories/1-gestion-tareas-api/historia.md` — HU #1: alcance, entidad Tarea y estados HTTP esperados
- Docs oficiales: nestjs.com (estructura modular), typeorm.io (entities/relations), class-validator.es

---

> **Método Ceiba generar-estandares-codigo** v2.4.87 | Usuario: Gerson Sanchez | Fecha: 2026-09-29
