# Trazo Técnico 3D — Estudio de ingeniería

Aplicación de **modelado tridimensional básico y paramétrico**, orientada a diseños conceptuales de tuberías, grapas, soportes, estructuras y equipos mecánicos desde una computadora o tableta Android.

> **Estado:** versión 2.0 base. Los componentes se generan con geometría original y son representaciones conceptuales, no modelos oficiales de fabricantes ni planos certificados para fabricación.

## Funciones actuales

- Lienzo 3D interactivo: un dedo o ratón para girar, dos dedos para zoom/desplazamiento.
- Selección de piezas por toque, herramientas **Mover** y **Girar** sobre los ejes 3D.
- **16 componentes paramétricos:** tubería hueca, codo, conexión T, brida con orificios, válvula conceptual, grapas tipo U y omega, perno, soporte, perfil I, placa perforada, caja industrial, tanque, eje, rotor de 10 discos y bomba esquemática.
- Edición numérica de diámetros, longitudes, espesores, cantidades, posición y orientación en **milímetros**.
- Vistas isométrica, superior, frontal y lateral; cuadrícula y ejes.
- Duplicar, borrar, deshacer, rehacer y recuperar trabajo local.
- Guardar/abrir proyectos editables **JSON**; exportar **PNG**, **STL** (mm), **GLB** (escala de metros).
- Compartir archivos en Android con Filesystem/Share de Capacitor.
- Interfaz responsiva para tabletas y móviles Android.

## Ejecutar en computadora

Requiere Node.js >=22.12.

```bash
npm install
npm run dev
```

Abrir en el navegador la dirección local mostrada por Vite. Para crear una versión web offline:

```bash
npm run check
npm run build
npm run preview
```

Los scripts se empaquetan en `dist/`: la app instalada no requiere una CDN.

## Crear APK Android desde GitHub Actions

1. En GitHub abrir la pestaña **Actions**.
2. Abrir **Trazo Tecnico 3D - APK de prueba** y pulsar **Run workflow**. También se ejecuta tras un cambio en la rama `main`.
3. Cuando la ejecución finalice correctamente, descargar **TrazoTecnico3D-APK-debug** desde **Artifacts**.
4. Extraer el ZIP y transferir `app-debug.apk` a la tableta.

**Advertencia:** este archivo es una **APK debug**, no está firmado para distribución pública. La firma debug generada en distintas ejecuciones puede cambiar; si Android rechaza una actualización, exporta antes tus proyectos JSON, desinstala la APK debug antigua y luego instala la nueva.

### Compilar localmente con Android Studio

Requiere Android Studio, Android SDK y Node.js 22+.

```bash
npm install
npm run android:add
npm run android:sync
npm run android:open
```

Android Studio permite compilar o instalar la APK en un dispositivo conectado.

## Estructura del proyecto

```text
index.html                 Entrada principal del editor 3D
src3d/main.js             Editor, cámara, interacciones, archivos, Android
src3d/parts.js            Componentes paramétricos originales
src3d/ui.css              Interfaz adaptada a escritorio y tableta
src/app.js                Motor del editor 2D anterior, conservado
src/styles.css            Estilos 2D anteriores, conservados
standalone/               HTML autónomo 2D original
capacitor.config.json     Configuración de la APK
.github/workflows/        Validación y compilación Android
```

## Límites técnicos de la versión base

- No incluye operaciones booleanas B-Rep, restricciones de ensamblaje, tolerancias, ni importación STEP/DXF.
- Los codos, válvulas y conexiones son modelos visuales: no deben tomarse como diseños de presión, soldadura o montaje comprobados.
- Cotas numéricas editables; las cotas anotadas en láminas y el cajetín se desarrollarán posteriormente.
- No se distribuyen modelos de terceros: antes de integrar catálogos de fabricantes deben revisarse licencias y condiciones.
- Datos guardados solo en el dispositivo; **exportar JSON periódicamente**.
- Máximo 300 componentes por proyecto como límite preventivo para Android.

## Siguientes mejoras

1. Conexiones automáticas de tubería, snapping a ejes y referencias geométricas.
2. Catálogo industrial verificable de diámetros nominales, espesores y clases de accesorios.
3. Croquis 2D asociados a sólidos, secciones y planos acotados; PDF y DXF.
4. Núcleo B-Rep (OpenCascade.js) para booleanas e importación/exportación STEP.
5. Importación de STL/GLB, grupos, capas, mediciones e interferencias.
6. Pruebas de APK en hardware real, firma estable y distribución.

## Tecnologías y documentación

- Three.js: https://threejs.org/manual/#en/installation
- Capacitor Android: https://capacitorjs.com/docs/android
- Filesystem: https://capacitorjs.com/docs/apis/filesystem
- Share: https://capacitorjs.com/docs/apis/share
- OpenCascade.js: https://ocjs.org/
- Modelos de referencia (no redistribuidos): https://www.traceparts.com/ y https://www.3dfindit.com/

## Nota de ingeniería

La aplicación se destina a **conceptos, bocetos y visualización**. Para fabricar, instalar u operar componentes deben comprobarse materiales, tolerancias, cargas, normas ASME/API/ISO pertinentes y cálculos de ingeniería por personal competente.