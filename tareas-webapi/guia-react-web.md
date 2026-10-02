# Guía Maestra de Desarrollo Web en React

---

### **1. Arquitectura de Proyecto y Entorno de Desarrollo (Vite)**
* **Herramientas de construcción modernas**: Emplea **Vite** para contar con un servidor de desarrollo local de alta velocidad basado en *Native ES Modules* y reemplazo de módulos en tiempo real (*HMR*).
* **Compiladores de nueva generación**: Utiliza entornos configurados con **SWC (Rust)** o transformadores modernos para procesar JSX a gran velocidad.
* **Punto de entrada HTML**: El archivo `index.html` debe ubicarse en la raíz del proyecto para actuar como el módulo fuente principal del grafo de dependencias.
* **Inicialización de la raíz**: Se conecta el contenedor HTML (`<div id="root"></div>`) mediante `createRoot` de `react-dom/client`, envolviendo la aplicación en `<StrictMode>` para auditar efectos secundarios durante el desarrollo.

---

### **2. Fundamentos de Componentización y JSX**
* **Programación Declarativa**: Modela la interfaz según el estado de los datos; evita modificar el DOM de forma imperativa con métodos nativos.
* **Componente vs. Elemento**:
  * **Componente**: Es la función que actúa como la "factoría" de elementos. Debe nombrarse obligatoriamente en **`PascalCase`** para distinguirse de las etiquetas HTML nativas.
  * **Elemento**: Es el objeto de JavaScript retornado por el componente que describe lo que se debe renderizar en la pantalla.
* **Reglas de JSX**:
  * Devuelve siempre un **nodo raíz único**. Utiliza **Fragmentos (`<>...</>`)** o `<React.Fragment key={...}>` para agrupar elementos sin añadir nodos extra al DOM.
  * Atributos en **`camelCase`**: Usa `className`, `htmlFor`, `onClick`, etc..
  * Inserta expresiones de JavaScript evaluables usando llaves `{}`.
  * Previene ataques de inyección de código (XSS) al escapar cadenas de texto automáticamente.

---

### **3. Gestión de Propiedades (*Props*), Inmutabilidad y Composición**
* **Props como Contrato**: Representan el flujo de datos unidireccional de padre a hijo y son estrictamente de solo lectura.
* **Inmutabilidad de Datos**: Nunca mutes ni modifiques las props o datos recibidos (evita métodos mutables como `.push()`); crea nuevas constantes derivadas o copias (`[...array]`, `{...objeto}`).
* **Sintaxis y Tipos de Props**:
  * Props no enviadas resultan en `undefined`, lo que permite asignar valores por defecto en la desestructuración de parámetros.
  * Sintaxis corta booleana: `<Button isFollowing />` equivale a `isFollowing={true}`.
  * Pasa funciones (*callbacks*) transmitiendo su referencia sin incluir paréntesis.
* **Propiedad `children`**: Utiliza `children` para componer elementos contenedores reutilizables anidando marcado directamente dentro de las etiquetas del componente.
* **Evitar la Propagación Masiva (`{...objeto}`)**: Pasar objetos enteros con el operador *spread* sin restricción puede invalidar la igualdad por referencia en memoria y provocar re-renderizados innecesarios.

---

### **4. Estado Local (`useState`), Eventos y Virtual DOM**
* **Memoria Local**: Declara el estado con la tupla `const [state, setState] = useState(initialValue)`.
* **Virtual DOM y Reconciliación**:
  * Al actualizar el estado mediante `setState`, React genera una representación en memoria, aplica un algoritmo de comparación (*diffing*) y actualiza de forma quirúrgica solo los nodos modificados en el DOM real.
  * Los re-renderizados se propagan automáticamente hacia los componentes hijos.
* **Estado Inicial desde Props (`initialProp`)**: `useState(initialProp)` evalúa la prop únicamente durante el montaje inicial. Si la prop del padre cambia en el futuro, el estado del hijo no se actualizará automáticamente. Usa la convención de nombres con el prefijo `initial` (ej. `initialIsFollowing`).
* **Eventos**: Asigna eventos en `camelCase` (`onClick`) pasando la función por referencia.

---

### **5. Manejo de Efectos Secundarios (`useEffect`) y Ciclo de Vida**
* **Sincronización con Sistemas Externos**: Utiliza `useEffect` para conectar el componente con APIs externas, suscripciones a eventos o temporizadores.
* **Arreglo de Dependencias**:
  * `[]`: Se ejecuta únicamente una vez tras el montaje inicial.
  * `[dep1, dep2]`: Se ejecuta al montar y cada vez que cambie alguna de las dependencias.
  * Sin arreglo: Se ejecuta tras cada renderizado.
* **Función de Limpieza (*Cleanup*)**: Devuelve una función para limpiar suscripciones, liberar recursos o abortar peticiones HTTP con `AbortController` al desmontar el componente.
* **Buena práctica**: Evita usar `useEffect` para calcular valores derivados que puedan procesarse directamente durante el renderizado.

---

### **6. Elevación de Estado (*Lifting State Up*) y Estado Global**
* **Flujo Unidireccional**: Los datos fluyen exclusivamente de componentes padres a componentes hijos.
* **Subir el Estado**: Cuando dos componentes hermanos necesitan compartir información dinámica, traslada el estado al **ancestro común más cercano** y distribúyelo a través de props junto a las funciones de actualización (*callbacks*).
* **Context API (`useContext`)**: Evita el paso de props a través de múltiples niveles intermedios (*prop drilling*) encapsulando el árbol con un `Provider` para distribuir datos globales (como temas o información de sesión).

---

### **7. Formularios: Componentes Controlados vs. No Controlados y `useRef`**
* **Componentes Controlados**: React controla el valor del formulario sincronizando la propiedad `value` con el estado local e interceptando los cambios con el evento `onChange`.
* **Componentes No Controlados**: El DOM mantiene el valor internamente; se lee la información al enviar el formulario o mediante referencias directas.
* **Hook `useRef`**: Mantiene un valor mutable que persiste a lo largo de todo el ciclo de vida del componente sin desencadenar re-renderizados al actualizarse.

---

### **8. Custom Hooks y Reglas Estrictas de los Hooks**
* **Custom Hooks**: Encapsulan lógica de estado reutilizable en funciones cuyo nombre debe comenzar obligatoriamente con el prefijo `use` (ej. `useFetch`).
* **Reglas de los Hooks**:
  1. Invócalos únicamente en el **nivel superior** (*top level*) del componente o Custom Hook.
  2. Nunca llames Hooks dentro de estructuras condicionales (`if`), bucles (`for`) o funciones anidadas.

---

### **9. Renderizado Condicional y Listas Dinámicas**
* **Condicionales en JSX**: Usa el operador ternario (`condicion ? <A /> : <B />`) o la evaluación lógica `&&` cuando no requieras una alternativa.
* **Mapeo con `.map()`**: Emplea el método nativo `.map()` para transformar colecciones de datos en listas de elementos JSX.
* **Propiedad `key` Obligatoria**:
  * Asigna un identificador único e inmutable (como el ID de la base de datos) a cada elemento devuelto en una lista para asistir al algoritmo de reconciliación.
  * **Malas prácticas**: No utilices `Math.random()`, `Date.now()` ni los índices del arreglo (`index`), ya que corrompen el seguimiento del Virtual DOM y generan fallos de rendimiento o interfaz.

---

### **10. Optimización, React Compiler y Estándares para 2026**
* **React Compiler (Memoización Automática)**: En las versiones modernas de React (React 19+ / 2026), el compilador analiza y memoiza automáticamente las dependencias y el renderizado, reduciendo la necesidad de utilizar manualmente `React.memo`, `useMemo` y `useCallback`.
* **Técnicas de Optimización Explicitas (Mantenimiento)**:
  * `React.memo`: Evita re-renderizar componentes puros si sus props no han cambiado.
  * `useMemo`: Preserva el resultado de cálculos computacionalmente costosos.
  * `useCallback`: Memoriza la referencia de funciones entre re-renderizados.
* **Manejo de Operaciones Asíncronas y Concurrencia**:
  * Uso de la función `use` para consumir recursos asíncronos o contextos directamente en el renderizado.
  * Transiciones con `useTransition` / `startTransition` para marcar actualizaciones no urgentes sin bloquear la experiencia de usuario.
  * Adopción de *Server Components* y *Server Actions* cuando se trabaja con frameworks web para transferir procesamiento pesado al servidor y reducir el tamaño del paquete cliente.