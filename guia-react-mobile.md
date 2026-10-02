# Guía Completa de Desarrollo de Aplicaciones Móviles con React Native y Expo

Esta guía técnica está estructurada paso a paso para que un agente o desarrollador pueda construir una aplicación móvil multiplataforma (iOS, Android y Web) desde cero utilizando las mejores prácticas de la industria.

---

### **Fase 1: Arquitectura y Configuración del Entorno**

1. **Plataforma y Filosofía:**
   * **React Native** es una plataforma de desarrollo creada por Meta en 2015 que compila código JavaScript/TypeScript directamente a componentes nativos del sistema operativo (`UIView` en iOS, `android.view` en Android) mediante un puente de comunicación (*bridge*).
   * Utiliza la misma biblioteca núcleo de React que la web, separando la lógica de la capa de renderizado (*Aprende una vez, escribe en cualquier sitio*).
   * Se recomienda el framework **Expo** como estándar oficial para gestionar el enrutado, los componentes del sistema y el ciclo de vida del proyecto.

2. **Inicialización del Proyecto:**
   * Ejecutar la creación con la plantilla vacía recomendada:
     ```bash
     npx create-expo-app@latest mi-app --template-blank
     ```
     *(El parámetro `--template-blank` inicializa una estructura limpia sin código innecesario)*.
   * Utilizar **`npm`** como gestor de paquetes para evitar inestabilidades con dependencias nativas durante el empaquetado.
   * El proyecto cuenta con soporte integrado para **TypeScript** por defecto.

3. **Herramientas de Desarrollo y Calidad de Código:**
   * **Visualización:** Probar en dispositivos físicos utilizando la aplicación **Expo Go** escaneando el código QR generado en la terminal. Los simuladores de iOS requieren ejecutarse en macOS.
   * **Metro & Recarga:** Presionar la tecla `r` en la terminal para recargar la aplicación en los clientes mediante Metro Bundler. Expo utiliza Babel internamente para el proceso de compilación.
   * **Linters y Formateo:**
     * Inicializar ESLint con el comando: `npx expo lint`.
     * Instalar e integrar Prettier:
       ```bash
       npx expo install -- --save-dev prettier eslint-config-prettier eslint-plugin-prettier
       ```
       Configurar las extensiones y reglas correspondientes en el archivo `.eslintrc`.

---

### **Fase 2: Componentes Primitivos, Estilos y Layout**

1. **Componentes Básicos de Interfaz:**
   * **`<View>`:** Bloque contenedor estructural equivalente al `div` web. **Comportamiento Flexbox:** Todos los contenedores `<View>` tienen `display: flex` activado por defecto y su dirección principal es vertical (`flexDirection: 'column'`).
   * **`<Text>`:** Componente obligatorio; toda cadena de texto debe estar dentro de un `<Text>`.
   * **`<Image>`:** Las imágenes locales se importan mediante `require()` o `import`. Las imágenes remotas requieren la propiedad `uri` junto con la definición explícita de `width` y `height` en sus estilos. Las dimensiones se definen en píxeles efectivos. Soporta modos de ajuste como `resizeMode="contain"` o `"center"` y propiedades específicas de plataforma como `fadeDuration` en Android.
   * **`<StatusBar>`:** Importado desde `expo-status-bar` para estilar el color y visibilidad de la barra superior del sistema operativo.

2. **Manejo de Interacción y Botones:**
   * **`<Button>`:** Componente nativo simple; recibe `title` y `onPress`, pero no acepta `children` ni estilos personalizados libres.
   * **`<TouchableHighlight>`:** Permite estilar botones personalizados y reacciona al toque mostrando un color de fondo configurado en `underlayColor`.
   * **`<Pressable>`:** El componente estándar, flexible y recomendado para gestionar cualquier evento táctil y crear botones personalizados a medida.
   * **Alertas Nativas:** Se ejecutan mediante la función `Alert.alert('Título', 'Mensaje')`.

3. **Áreas Seguras (*Safe Areas*) y Ajustes de Pantalla:**
   * El componente nativo `<SafeAreaView>` únicamente funciona de forma correcta en iOS.
   * La solución estándar y multiplataforma es instalar `react-native-safe-area-context`.
   * Estructura: Envolver la raíz de la aplicación con `<SafeAreaProvider>` y consumir las dimensiones exactas (`top`, `bottom`, `left`, `right`) mediante el hook `useSafeAreaInsets()`.

---

### **Fase 3: Listas Eficientes, Multimedia y Animaciones**

1. **Renderizado de Listas (`FlatList` vs `ScrollView`):**
   * **`<ScrollView>`:** Carga todos sus elementos en memoria simultáneamente, produciendo problemas de rendimiento en listas dinámicas o extensas.
   * **`<FlatList>`:** Utiliza virtualización de memoria para renderizar únicamente los elementos visibles dentro del *viewport*.
   * Propiedades clave de `FlatList`:
     * `data`: Matriz de información a renderizar.
     * `keyExtractor`: Función que retorna un identificador único e inmutable (como `item.id` o `item.slug`). Evitar el uso de índices de arreglo o valores aleatorios.
     * `renderItem`: Función que define cómo se maquetará cada elemento de la colección (`({ item, index }) => <Card />`).

2. **Vectores SVG e Íconos:**
   * Las imágenes `.svg` no son compatibles directamente con `<Image>`. Se requiere instalar `react-native-svg` y convertir el marcado XML a código JSX usando la herramienta **SVGR**.
   * Para colecciones de íconos integradas, utilizar la librería `@expo/vector-icons`.

3. **Indicadores de Carga y Animaciones Nativas:**
   * **`<ActivityIndicator>`:** Componente nativo para mostrar un spinner durante llamadas asíncronas (`size`, `color`).
   * **API `Animated`:** Módulo para construir animaciones fluidas:
     1. Inicializar el valor animable: `const opacity = useRef(new Animated.Value(0)).current`.
     2. Configurar la transición:
        ```javascript
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true, // Delega el procesamiento al hilo nativo
        }).start();
        ```
     3. Utilizar `useNativeDriver: true` para optimizar el rendimiento evitando bloqueos en el hilo de JavaScript.

---

### **Fase 4: Enrutamiento Avanzado y Estilos con TailwindCSS**

1. **Expo Router (Navegación Basada en Archivos):**
   * El sistema de rutas se configura mediante archivos dentro del directorio **`app/`**.
   * **Punto de Entrada / Layout (`app/_layout.js`):** Envuelve la aplicación definiendo la estructura principal mediante `<Stack>` o `<Tabs>`.
   * **Pantalla Raíz (`app/index.js`):** Pantalla principal correspondiente a la ruta base (`/`).
   * **Rutas Dinámicas (`app/[id].js`):** Los corchetes en el nombre del archivo capturan parámetros de URL dinámicos. Se leen dentro del componente mediante el hook `useLocalSearchParams()`.
   * **Navegación Declarativa:** Se utiliza el componente `<Link href="/ruta" asChild>` en combinación con un `<Pressable>`.
   * **Deep Linking:** Se define una propiedad `scheme` en el archivo `app.json` para permitir la apertura de la app mediante enlaces externos.

2. **Estilos Utilitarios con NativeWind (TailwindCSS):**
   * **NativeWind** compila las clases utilitarias de TailwindCSS a objetos de estilo nativos compatibles con React Native.
   * Permite aplicar clases condicionales y estados interactivos usando la pseudoclase `active:` sobre componentes `<Pressable>`.

---

### **Fase 5: Estado y Conexión de Datos**

1. **Gestión de Estado y Efectos (Hooks):**
   * Utilizar **`useState`** para conservar el estado local interactivo y desencadenar el proceso de reconciliación visual cuando los datos cambien.
   * Utilizar **`useEffect`** para ejecutar peticiones asíncronas a APIs o efectos secundarios al montarse la pantalla.
