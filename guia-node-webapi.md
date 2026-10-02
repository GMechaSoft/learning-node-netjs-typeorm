### Guía de Desarrollo de APIs RESTful con NestJS, TypeScript, TypeORM y PostgreSQL

Esta guía sintetiza los pasos, configuraciones y comandos para que un agente o desarrollador pueda construir una API backend escalable de principio a fin.

---

#### 1. Requisitos Previos y Entorno de Desarrollo
- **Entorno de ejecución:** Tener instalado **Node.js** (versión 18 o superior) junto con un gestor de paquetes como **npm**, **yarn** o **pnpm**.
- **Herramientas de editor:** Se recomienda utilizar Visual Studio Code equipado con extensiones como *Material Icons* (configurando el paquete activo para NestJS), *Thunder Client* para pruebas HTTP y *JSON Viewer* para inspección en navegador.
- **Base de datos:** Motor **PostgreSQL** accesible localmente o mediante un contenedor de desarrollo.

---

#### 2. Instalación de la CLI e Inicialización del Proyecto
1. **Instalar el CLI global de NestJS:**
   ```bash
   npm install -g @nestjs/cli
   ```
   *Comprobar instalación con `nest -v`*.
2. **Generar un nuevo proyecto:**
   ```bash
   nest new nombre-del-proyecto
   ```
   *(Seleccionar `npm` como gestor de paquetes)*.
3. **Estructura generada:**
   El CLI crea la carpeta `src/` con el punto de entrada `main.ts`, el módulo raíz `app.module.ts`, un controlador básico (`app.controller.ts`) y su servicio (`app.service.ts`). También incluye archivos de compilación (`tsconfig.json`), formateo (`.prettierrc`), auditoría de código (`.eslintrc.js`) y configuración del CLI (`nest-cli.json`).

---

#### 3. Configuración de TypeORM con PostgreSQL y TypeScript
1. **Instalar dependencias necesarias:**
   ```bash
   npm install typeorm reflect-metadata pg
   npm install @types/node --save-dev
   ```
  
2. **Importar `reflect-metadata`:**
   Incluir `import "reflect-metadata"` en el punto de entrada global de la aplicación (por ejemplo en `main.ts` o `app.ts`).
3. **Configurar `tsconfig.json`:**
   Asegurar que la versión de TypeScript sea 4.5 o superior e incluir la emisión de metadatos para decoradores:
   ```json
   {
     "compilerOptions": {
       "target": "es2021",
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     }
   }
   ```
4. **Definir el `DataSource` de TypeORM:**
   Crear una instancia de `DataSource` (frecuentemente en `data-source.ts`) configurando la conexión a PostgreSQL:
   ```typescript
   import "reflect-metadata";
   import { DataSource } from "typeorm";
   import { Usuario } from "./entity/Usuario";

   export const AppDataSource = new DataSource({
     type: "postgres",
     host: "localhost",
     port: 5432,
     username: "postgres",
     password: "password",
     database: "mi_api_db",
     entities: [Usuario],
     synchronize: true, // Sincroniza las entidades automáticamente con las tablas
     logging: false,
   });
   ```
5. **Inicializar la conexión:**
   Al arrancar la aplicación, invocar `AppDataSource.initialize()` para registrar las entidades y establecer la conexión con PostgreSQL.

---

#### 4. Definición de Entidades y Relaciones
Las tablas de PostgreSQL se definen como clases de TypeScript anotadas con decoradores de TypeORM:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column("text")
  email: string;

  @Column({ default: true })
  activo: boolean;
}
```
- **Decoradores principales:** `@Entity()` declara la tabla, `@PrimaryGeneratedColumn()` define la clave primaria autogenerada, y `@Column()` establece el tipo y restricciones de cada columna.
- **Relaciones entre tablas:** Se pueden mapear relaciones uno a uno (`@OneToOne`), uno a muchos / muchos a uno (`@OneToMany` y `@ManyToOne`) y muchos a muchos (`@ManyToMany`) acompañadas de `@JoinColumn()` o `@JoinTable()` según la entidad propietaria.

---

#### 5. Arquitectura Modular y Generación de Recursos
NestJS organiza las aplicaciones mediante módulos que agrupan controladores y proveedores:
- **Generar módulos individuales:**
  ```bash
  nest generate module usuarios
  # o de forma abreviada: nest g mo usuarios
  ```
 
  Los módulos se componen del decorador `@Module({ controllers: [...], providers: [...], imports: [...], exports: [...] })`. Todos los módulos deben registrarse en la propiedad `imports` del módulo raíz `AppModule`.
- **Generación rápida de recursos CRUD completos:**
  ```bash
  nest generate resource pagos
  ```
  Genera automáticamente el módulo, controlador, servicio, DTOs, archivo de entidad y plantillas de pruebas para una API RESTful.

---

#### 6. Controladores, Manejo de Peticiones y DTOs
1. **Controladores (`@Controller`):**
   Gestionan las rutas y métodos HTTP (`@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`).
   - Extraer cuerpo de la petición: `@Body()`.
   - Extraer parámetros de ruta: `@Param('id')`.
   - Extraer parámetros de consulta: `@Query()`.
2. **Transferencia de Datos y Validaciones (DTOs):**
   - Instalar las bibliotecas de validación:
     ```bash
     npm install class-validator class-transformer
     ```
    
   - Crear una clase DTO anotando las propiedades con validadores:
     ```typescript
     import { IsString, IsEmail, IsNotEmpty, MinLength } from "class-validator";

     export class CreateUserDto {
       @IsString()
       @IsNotEmpty()
       nombre: string;

       @IsEmail()
       email: string;

       @IsString()
       @MinLength(6)
       password: string;
     }
     ```
   - Habilitar el tubo de validación global en `main.ts` para validar todas las entradas y descartar propiedades no declaradas:
     ```typescript
     app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
     ```

---

#### 7. Servicios y Operaciones con TypeORM
Los servicios (`@Injectable`) contienen la lógica de negocio. Se inyectan en el constructor de los controladores mediante modificadores de acceso de TypeScript.

Para interactuar con la base de datos, se utiliza el repositorio de la entidad (`AppDataSource.getRepository(Entidad)`):
- **Obtener todos los registros:** `repository.find()`.
- **Buscar por criterios:** `repository.findOneBy({ id })`.
- **Crear o actualizar:** `repository.save(instancia)`.
- **Eliminar registro:** `repository.remove(instancia)`.
- **Consultas complejas:** `repository.createQueryBuilder("alias")` para realizar uniones, filtros y paginación mediante sintaxis encadenada.

---

#### 8. Pipes, Guards, Middlewares y OpenAPI (Swagger)
- **Pipes:** Transforman o convierten tipos de datos en la entrada de las rutas (por ejemplo, `ParseIntPipe` o `ParseBoolPipe` para convertir parámetros de cadena a enteros o booleanos).
- **Guards:** Protegen rutas evaluando condiciones de acceso (como verificación de roles o cabeceras de autorización) implementando la interfaz `CanActivate`.
- **Middlewares:** Interceptan peticiones a nivel de módulo ejecutando tareas previas (como registros de peticiones o comprobaciones HTTP) mediante funciones `(req, res, next)` de estilo Express.
- **CORS:** Habilitar el intercambio de recursos de origen cruzado en `main.ts` mediante `app.enableCors()`.
- **Documentación OpenAPI:**
  1. Instalar `@nestjs/swagger`.
  2. Inicializar `SwaggerModule.createDocument(app, config)` y exponer la ruta en `main.ts`.
  3. Añadir decoradores `@ApiTags('nombre')`, `@ApiOperation({ summary: '...' })` y `@ApiResponse({ status: 200, description: '...' })` en los controladores para categorizar y documentar la API.

---

#### 9. Ciclo de Ejecución, Compilación y Calidad de Código
- **Modo Desarrollo con recarga automática:**
  ```bash
  npm run start:dev
  ```
  *(Arranca la aplicación escuchando cambios en tiempo real, por defecto en `http://localhost:3000`)*.
- **Análisis estático de código (ESLint):**
  ```bash
  npm run lint
  ```
  *(Analiza el proyecto detectando variables sin usar, importaciones no utilizadas o errores de sintaxis)*.
- **Compilación para producción:**
  ```bash
  npm run build
  ```
  *(Transforma todo el código de TypeScript ubicado en `src/` a JavaScript optimizado dentro de la carpeta `dist/`)*.
- **Ejecución en producción:**
  ```bash
  npm run start
  ```
  *(Ejecuta la versión compilada previamente desde `dist/`)*.