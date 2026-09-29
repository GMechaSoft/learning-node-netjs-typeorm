# Arquitectura del Sistema - GPS Principal

Este documento sirve como **GPS arquitectónico** para orientar decisiones de diseño y desarrollo en el ecosistema.

## Resumen Ejecutivo

### Propósito y alcance del sistema

API REST "Sistema de Gestión de Tareas": backend NestJS + TypeScript + TypeORM + PostgreSQL que expone el CRUD completo de tareas con autenticación JWT. Entregable: repositorio GitHub con la REST API funcional. El sistema NO incluye interfaz de usuario, mensajería ni integraciones con sistemas de terceros; su único canal de negocio es HTTP/JSON.

### Dominios y repositorios críticos

- **Dominios/módulos críticos**: (1) Tareas — CRUD, entidad `Tarea` (título, descripción, estado pendiente|completada); (2) Autenticación — emisión/verificación JWT (precondición de la HU #1, módulo pendiente).
- **Repositorios críticos**: 1 solo repo — la REST API (NestJS). Sin microservicios ni repos adicionales.
- **Límites del sistema**: incluye API de tareas + auth JWT + persistencia PostgreSQL. No incluye: UI, workers, colas de mensajes, APIs externas.
- **Estado del proyecto**: greenfield — sin código aún; este GPS documenta la arquitectura objetivo a materializar.

## Arquitectura de Alto Nivel

### Diagrama principal del ecosistema

```mermaid
graph TB
    subgraph "Sistemas Externos"
        CL[Clientes HTTP - Thunder Client / futuros frontends]
        PG[(PostgreSQL 5432)]
    end
    subgraph "RestApi - NestJS + TypeScript"
        subgraph "Borde - API"
            CTRL[Controladores REST - /tareas]
            GUARD[Guard JWT - auth]
        end
        subgraph "Aplicación - CQRS"
            CMD[Handlers Command - crear/actualizar/eliminar]
            qry[Handlers Query - listar/obtener]
            DTO[DTOs + validación class-validator]
        end
        subgraph "Dominio - DDD"
            ENT[Entidad Tarea]
            RULES[Reglas: titulo obligatorio, estado pendiente|completada]
        end
        subgraph "Infraestructura"
            REPO[Repository TypeORM]
        end
    end
    CL -->|HTTP/JSON + Bearer JWT| GUARD
    GUARD --> CTRL
    CTRL --> DTO
    DTO --> CMD
    DTO --> qry
    CMD --> ENT
    qry --> ENT
    ENT --> REPO
    REPO -->|SQL| PG
```

Descripción: un único contenedor (RestApi) con estructura hexagonal interna — borde API (controladores + guard JWT), capa de aplicación CQRS (comandos y consultas), dominio (entidad Tarea con sus reglas) e infraestructura (TypeORM sobre PostgreSQL). El cliente externo siempre ingresa por HTTP con token JWT; la base de datos es el único sistema de estado del ecosistema.

## Stack y Patrones Clave

### Tecnologías que condicionan arquitectura

- **Lenguajes/frameworks clave**: Node.js ≥18, TypeScript (≥4.5, decorators + `emitDecoratorMetadata`), NestJS (modular, DI nativo).
- **Datos y persistencia**: PostgreSQL vía TypeORM (`DataSource` + `pg`); `synchronize: true` solo para desarrollo (decisiones de schema en producción pendientes).
- **Validación/documentación**: class-validator + class-transformer (DTOs), @nestjs/swagger (OpenAPI en el borde).
- **Plataforma/infraestructura**: sin cloud — local o contenedor de desarrollo; decisiones pendientes: docker-compose para PostgreSQL y librería JWT (@nestjs/jwt).

### Patrones arquitectónicos relevantes

- **Hexagonal** (objetivo, declarado en brief): dominio aislado de framework — controladores y TypeORM son adaptadores intercambiables. Impacto: permite evolucionar el borde (otra API) o el storage sin tocar el dominio.
- **CQRS** (objetivo): separa comandos (crear/actualizar/eliminar) de consultas (listar/obtener) en la capa de aplicación. Impacto: escalabilidad de lecturas y responsabilidades claras por HU.
- **DDD táctico** (objetivo): entidad `Tarea` con reglas de negocio en el dominio (título obligatorio, transiciones de estado). Impacto: los invariantes viven donde pertenecen, no en el controlador.
- **DI** (nativo de NestJS): inyección de dependencias en todos los módulos — base sobre la que se construyen los tres patrones anteriores.

## Integraciones Críticas

### Integraciones internas y externas de mayor impacto

- **Integración crítica**: Clientes HTTP ↔ RestApi — único canal de negocio del sistema (CRUD de tareas autenticado).
  - **Canal/protocolo**: REST/HTTP, JSON, autenticado con Bearer JWT.
  - **Criticidad**: alto — sin este canal no hay sistema.
- **Integración crítica**: RestApi ↔ PostgreSQL — persistencia de la entidad Tarea.
  - **Canal/protocolo**: conexión directa SQL (driver `pg` vía TypeORM).
  - **Criticidad**: alto — único sistema de estado; su disponibilidad = disponibilidad del sistema.
- **Integración futura**: módulo de registro/login (emisión de tokens JWT) — habilita el borde de seguridad en producción.
  - **Canal/protocolo**: REST/HTTP sobre el mismo borde de la API.
  - **Criticidad**: medio (precondición operativa de la HU #1).

### Seguridad de integración (Auth/Authz)

- **Autenticación**: JWT en header `Authorization: Bearer` en el borde de la API (guard NestJS). Emisión de tokens: módulo de auth pendiente.
- **Autorización**: sin RBAC/roles por ahora — cualquier usuario autenticado accede a todo el CRUD.
- **Controles críticos**: (1) guard JWT en todas las rutas `/tareas` (401 sin token); (2) validación estricta de DTOs (`whitelist: true`); (3) credenciales de PostgreSQL fuera de código fuente → variables de entorno (la guía actual las hardcodea: gap a corregir en implementación).

## Dependencias Externas Estratégicas

### Servicios y terceros que condicionan la solución

- **PostgreSQL** (motor de persistencia): única fuente de estado. Si falla, el sistema completo queda inutilizable; no hay replicación ni réplicas en esta fase.
- **NestJS + TypeORM** (framework/ORM): condicionan la estructura modular, el uso de decoradores/metadata y la estrategia de schema. Su madurez es alta; riesgo bajo.
- **Sin dependencias cloud ni de terceros en runtime** — el sistema es autocontenido; la única dependencia externa operativa es el motor de base de datos.

## Referencias Base

### Documentación analizada y fuentes clave

- `guia.md` — guía de desarrollo de la API (stack, comandos CLI, entidades, pipes/guards, Swagger). Describe el stack base y el patrón simple Controller→Service→Repository del CLI NestJS; el patrón objetivo (hexagonal + CQRS + DDD) proviene del brief del proyecto y este GPS lo documenta como arquitectura a materializar.
- `docs/stories/1-gestion-tareas-api/historia.md` — HU #1 (CRUD de tareas, 7 ACs GWT, precondición JWT): fuente de alcance, entidad y flujos.
- Brief del proyecto (sesión): entregable repo GitHub, stack NestJS/PostgreSQL/TypeORM, patrones CQRS, DI, DDD, Hexagonal.
- Workspace sin código (greenfield) — verificado en la exploración: no existen `package.json`, `src/` ni `docker-compose`.

---

**Este GPS es una vista arquitectónica ejecutiva para orientar decisiones y priorizar evolución del sistema.**

---

> **Método Ceiba documentar-arquitectura-base** v2.4.87 | Modelo: miia | Usuario: Gerson Sanchez | Fecha: 2026-09-29
